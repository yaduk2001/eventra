# Eventrra - Premium Event Management Marketplace

A world-class, modern event management marketplace frontend built with React, Next.js, and premium design principles. Features subtle 3D effects, glassmorphism, and smooth animations for a professional, elegant user experience.

## ✨ Features

### 🎨 Premium Design
- **Modern & Clean**: Minimalist design with premium aesthetics
- **Subtle 3D Effects**: Floating particles and geometric shapes using Three.js
- **Glassmorphism**: Beautiful glass-like cards and components
- **Smooth Animations**: Framer Motion powered micro-interactions
- **Professional Typography**: Inter font family with perfect spacing

### 🏗️ Architecture
- **Component-Based**: Modular, reusable React components
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Performance Optimized**: Lazy loading and efficient rendering
- **Accessibility**: WCAG compliant with proper ARIA labels

### 📱 Pages & Components

#### Landing Page (`/`)
- Hero section with floating 3D particles
- Featured categories with hover animations
- Premium service provider cards
- Customer testimonials with glassmorphism
- Call-to-action sections with gradient backgrounds

#### Service Listings (`/services`)
- Advanced filtering sidebar
- Grid/List view toggle
- Premium service cards with hover effects
- Search functionality
- Category-based filtering

#### Provider Profiles (`/provider/[id]`)
- Instagram/Behance-style layout
- Portfolio gallery with masonry grid
- Package pricing tables
- Customer reviews section
- Contact information and social links

#### Booking Flow (`/booking`)
- Step-by-step wizard with progress indicator
- Smooth transitions between steps
- Form validation and data persistence
- Animated success states

#### Dashboard (`/dashboard`)
- Role-based interface (Customer/Provider/Admin)
- Real-time statistics cards
- Recent bookings and messages
- Notification center
- Analytics overview

#### Admin Panel (`/admin`)
- Provider approval workflow
- Booking management
- User reports and disputes
- Platform analytics
- Content moderation tools

### 🎯 Key Components

#### UI Components
- `PremiumButton`: Animated buttons with shimmer effects
- `PremiumCard`: Glassmorphism cards with hover animations
- `FloatingParticles`: 3D background particles
- `Navigation`: Responsive sidebar navigation

#### Design System
- **Colors**: Indigo, Purple, Pink gradient palette
- **Typography**: Inter font with proper hierarchy
- **Spacing**: Consistent 8px grid system
- **Shadows**: Depth-based shadow system
- **Animations**: Smooth, purposeful transitions

### 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth interactions
- **3D Graphics**: Three.js with React Three Fiber
- **Icons**: Lucide React for consistent iconography
- **State Management**: React hooks and context

### 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

### 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.js            # Landing page
│   ├── services/          # Service listings
│   ├── provider/[id]/     # Provider profiles
│   ├── booking/           # Booking flow
│   ├── dashboard/         # User dashboard
│   └── admin/             # Admin panel
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── PremiumButton.js
│   │   ├── PremiumCard.js
│   │   └── GlassmorphismCard.js
│   ├── 3D/                # 3D components
│   │   └── FloatingParticles.js
│   └── Navigation.js       # Navigation component
├── styles/
│   └── globals.css        # Global styles and design system
└── lib/                   # Utility functions
```

### 🎨 Design Principles

#### Color Palette
- **Primary**: Indigo (#6366F1) to Purple (#8B5CF6)
- **Secondary**: Pink (#EC4899) to Rose (#F43F5E)
- **Neutral**: Slate grays for text and backgrounds
- **Accent**: Yellow for highlights and ratings

#### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800
- **Scale**: Perfect fourth (1.333) ratio
- **Line Height**: 1.5 for body, 1.2 for headings

#### Spacing
- **Base Unit**: 8px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96px
- **Container**: Max-width 1280px with responsive padding

#### Animations
- **Duration**: 300ms for micro-interactions, 600ms for page transitions
- **Easing**: Custom cubic-bezier curves for natural motion
- **Hover Effects**: Scale (1.02-1.05) and lift (-2px to -8px)
- **Loading States**: Skeleton screens and progress indicators

### 🔧 Customization

#### Theme Configuration
The design system is fully customizable through Tailwind CSS configuration:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... more colors
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        // ... more animations
      }
    }
  }
}
```

#### Component Variants
All components support multiple variants:

```jsx
<PremiumButton variant="primary" size="lg">
  Click Me
</PremiumButton>

<PremiumCard hoverEffect="lift" glass>
  Content
</PremiumCard>
```

### 📱 Responsive Design

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+
- **Large Desktop**: 1280px+

### ♿ Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and roles
- **Color Contrast**: WCAG AA compliant
- **Focus Management**: Visible focus indicators
- **Semantic HTML**: Proper heading hierarchy

### 🚀 Performance

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Components and images
- **Bundle Size**: Optimized with tree shaking
- **Core Web Vitals**: Optimized for LCP, FID, CLS

### 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### 📦 Deployment

The application is ready for deployment on:

- **Vercel** (Recommended)
- **Netlify**
- **AWS Amplify**
- **Any Node.js hosting**

```bash
# Build for production
npm run build

# Start production server
npm start
```

### 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

### 🙏 Acknowledgments

- **Design Inspiration**: Airbnb, Behance, Eventbrite, Dribbble, Canva
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **3D Graphics**: Three.js
- **Styling**: Tailwind CSS

---

Built with ❤️ for the future of event management.