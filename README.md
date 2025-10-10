# 🎉 Eventrra - Full-Stack Event Management Marketplace

A comprehensive event management platform connecting customers with service providers including event companies, caterers, photographers, transportation services, and freelancers.

## 🌟 Features

### Core User Types
- **Customers** - Book services and create event requests
- **Service Providers** - Offer services and bid on requests
- **Admin Panel** - Manage platform, approve providers, monitor activity

### Key Features
- 🔐 **Multi-role Authentication** (Firebase Auth + JWT)
- 🏢 **Service Provider Management** with approval workflow
- 💰 **Advanced Bidding System** with real-time updates
- 📱 **Portfolio Management** (Instagram-like interface)
- 🔔 **Real-time Notifications** (WebSocket-based)
- 🔍 **Advanced Search & Filtering**
- 📊 **Admin Dashboard** with analytics
- 💳 **Payment Integration** (placeholder)
- 📱 **Responsive Design** with 3D animations

## 🛠️ Tech Stack

### Backend
- **Node.js + Express** - RESTful API
- **MySQL** - Relational database
- **Firebase Admin SDK** - Authentication
- **Socket.IO** - Real-time features
- **JWT** - Token-based authentication
- **Multer** - File uploads
- **Joi** - Data validation

### Frontend
- **Next.js 15** - React framework
- **Tailwind CSS** - Styling
- **Firebase SDK** - Client authentication
- **Socket.IO Client** - Real-time updates
- **React Hook Form** - Form management
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Firebase project
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd Eventrra
```

### 2. Run Setup Script
```bash
node setup-platform.js
```

### 3. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE eventrra;

# Import schema
mysql -u root -p eventrra < backend/database/schema.sql
```

### 4. Environment Configuration

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# MySQL Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=eventrra
DB_PORT=3306

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Start Development Servers

#### Backend Server
```bash
cd backend
npm run dev
```

#### Frontend Server
```bash
cd frontend
npm run dev
```

### 6. Initialize Platform
```bash
# Create admin user
node backend/scripts/createAdmin.js

# Seed sample data
node backend/scripts/seedData.js
```

## 📁 Project Structure

```
Eventrra/
├── backend/                 # Node.js + Express API
│   ├── config/             # Database & Firebase config
│   ├── routes/             # API route handlers
│   ├── middleware/         # Authentication & validation
│   ├── services/           # Business logic services
│   ├── scripts/            # Setup & utility scripts
│   ├── database/           # Database schema & migrations
│   └── server.js           # Main server file
├── frontend/               # Next.js React application
│   ├── src/
│   │   ├── app/           # Next.js 13+ app directory
│   │   ├── contexts/      # React contexts
│   │   ├── lib/           # Utilities & API client
│   │   └── components/    # Reusable components
│   └── public/            # Static assets
└── README.md              # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Search & Discovery
- `GET /api/search/providers` - Search service providers
- `GET /api/search/events` - Search events
- `GET /api/search/bid-requests` - Search bid requests
- `GET /api/search/filters` - Get search filters

### Bookings & Bidding
- `POST /api/bookings/bid-request` - Create bid request
- `GET /api/bookings/bid-requests` - Get bid requests
- `POST /api/bookings/bid-request/:id/bid` - Submit bid
- `PATCH /api/bookings/bid-request/:id/bid/:bidId` - Accept/reject bid

### Portfolio Management
- `POST /api/portfolio/upload` - Upload portfolio media
- `GET /api/portfolio` - Get portfolio items
- `POST /api/portfolio/:id/like` - Like portfolio item
- `POST /api/portfolio/:id/comment` - Comment on portfolio

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Admin Panel
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/pending-approvals` - Pending approvals
- `PATCH /api/admin/approve-user/:id` - Approve user
- `PATCH /api/admin/reject-user/:id` - Reject user

## 🎨 UI Components

### 3D Animated Components
- **Portfolio Gallery** - 3D card flip effects
- **Service Cards** - Hover animations
- **Navigation** - Smooth transitions
- **Dashboard** - Interactive elements

### Responsive Design
- **Mobile-first** approach
- **Tailwind CSS** for styling
- **Dark/Light mode** support
- **Accessibility** features

## 🔐 Security Features

- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (RBAC)
- **Input Validation** with Joi
- **Rate Limiting** to prevent abuse
- **CORS Configuration** for security
- **Helmet.js** for security headers

## 📊 Database Schema

### Core Tables
- `users` - User accounts and profiles
- `service_providers` - Detailed provider information
- `events` - Event listings
- `bid_requests` - Service requests
- `bids` - Provider bids
- `bookings` - Confirmed bookings
- `portfolio` - Provider portfolios
- `notifications` - User notifications
- `reviews` - Service reviews

## 🚀 Deployment

### Backend Deployment
1. Set up MySQL database
2. Configure environment variables
3. Deploy to cloud platform (AWS, DigitalOcean, etc.)
4. Set up SSL certificates

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Deploy to Vercel, Netlify, or similar
3. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core platform setup
- ✅ User authentication
- ✅ Service provider management
- ✅ Basic booking system

### Phase 2 (Next)
- 🔄 Advanced search & filtering
- 🔄 Real-time notifications
- 🔄 Portfolio management
- 🔄 Admin dashboard

### Phase 3 (Future)
- 📅 Payment integration
- 📅 Mobile app
- 📅 Advanced analytics
- 📅 AI recommendations

---

**Built with ❤️ for the event management community**
