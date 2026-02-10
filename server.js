require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const admin = require('firebase-admin');
const i18next = require('./i18n');

const app = express();

// Initialize Firebase Admin
if (process.env.FIREBASE_PRIVATE_KEY && !process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_PRIVATE_KEY')) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.log('Firebase credentials not set, skipping Firebase Admin initialization');
}

// Middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/');
  }
  next();
};
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// i18next middleware
app.use((req, res, next) => {
  const lang = req.query.lang || req.session.lang || 'en';
  req.session.lang = lang;
  i18next.changeLanguage(lang);
  res.locals.t = i18next.t;
  res.locals.lang = lang;
  res.locals.dir = lang === 'ar' ? 'rtl' : 'ltr';
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/special-technician', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Language switch route
app.get('/switch-language/:lang', (req, res) => {
  const lang = req.params.lang;
  if (['en', 'ar'].includes(lang)) {
    req.session.lang = lang;
  }
  res.redirect(req.header('Referer') || '/');
});

// Routes
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user || null });
});

app.get('/admin-login', (req, res) => {
  res.render('admin-login');
});

app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', { user: req.session.user || null });
});

// Auth routes
app.use('/auth', require('./routes/auth'));

// Service routes
app.use('/services', require('./routes/services'));
app.use('/api/services', require('./routes/services'));

// Catalog routes (service catalog management)
app.use('/api/catalog', require('./routes/catalog'));

// Service areas routes
app.use('/api', require('./routes/areas'));

// Contact routes
app.use('/api/contact', require('./routes/contact'));

// Dashboard routes
app.use('/api/dashboard', require('./routes/dashboard'));

// Admin page route (serves the admin panel page)
app.get('/admin', requireAdmin, (req, res) => {
  res.render('admin', { user: req.session.user || null });
});

// Admin API routes (must come after the GET /admin route)
app.use('/admin', require('./routes/admin'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));