# The Blacklist - Project Structure

## Current File Structure

```
tblx/
├── src/
│   ├── admin/                    # Admin panel
│   │   ├── assets/
│   │   │   ├── css/
│   │   │   │   └── admin.css
│   │   │   └── js/
│   │   │       ├── admin-dashboard-charts.js
│   │   │       ├── admin-manager.js
│   │   │       └── admin-string-schema.js
│   │   ├── routes/
│   │   │   └── adminRouter.js
│   │   └── views/
│   │       ├── layouts/
│   │       │   └── admin-layout.ejs
│   │       ├── partials/
│   │       │   └── admin-head.ejs
│   │       ├── dashboard.ejs
│   │       ├── error.ejs
│   │       └── items.ejs
│   ├── public/                   # Public-facing application
│   │   ├── assets/
│   │   │   ├── css/
│   │   │   │   └── style.css
│   │   │   ├── js/
│   │   │   │   ├── demo-manager.js
│   │   │   │   ├── gsap/
│   │   │   │   │   └── script.js
│   │   │   │   ├── index.js
│   │   │   │   ├── item-renderer.js
│   │   │   │   ├── quota-message-helper.js
│   │   │   │   ├── stats-page-charts.js
│   │   │   │   └── string-schema.js
│   │   │   ├── favicon.ico
│   │   │   └── images/
│   │   │       └── posters/
│   │   │           ├── 1.avif
│   │   │           └── 1.jpg
│   │   ├── routes/
│   │   │   └── listRouter.js
│   │   ├── views/
│   │   │   ├── layouts/
│   │   │   │   ├── list-layout.ejs
│   │   │   │   ├── stats-layout.ejs
│   │   │   │   └── status-layout.ejs
│   │   │   ├── partials/
│   │   │   │   ├── head.ejs
│   │   │   │   ├── list-components.ejs
│   │   │   │   └── stats-cards.ejs
│   │   │   ├── list/
│   │   │   │   ├── index.ejs
│   │   │   │   ├── status.ejs
│   │   │   │   └── v2/
│   │   │   │       └── index.ejs
│   │   │   ├── stats/
│   │   │   │   └── index.ejs
│   │   │   ├── the-blacklist/
│   │   │   │   └── index.ejs
│   │   │   ├── error.ejs
│   │   │   └── index.ejs
│   │   └── robots.txt
│   └── shared/                   # Shared resources
│       ├── assets/
│       │   └── js/
│       │       └── chart-utils.js
│       ├── config/
│       │   └── firebase-cfg.js
│       └── data/
│           ├── dummy-data.json
│           └── README.md
├── server.js                     # Main server entry point
├── package.json
├── pnpm-lock.yaml
├── vercel.json
├── .gitignore
├── STRUCTURE.md                  # This file
├── FUTURE_ENHANCEMENTS.md       # Future features roadmap
└── PUBLIC_ROUTES.md             # Public API documentation
```

## Key Features & Recent Updates

### **🎯 Current Functionality**

**Public Pages:**
- ✅ **Homepage** (`/`) - Main landing page with GSAP animations
- ✅ **List Views** (`/list`, `/list/v2`) - Versioned list displays with toggle navigation
- ✅ **Status Pages** (`/list/{status}`) - Filtered views by status (deceased, active, incarcerated, etc.)
- ✅ **Statistics** (`/stats`) - Interactive charts and analytics with HTMX auto-refresh
- ✅ **The Blacklist** (`/the-blacklist`) - Legacy view with consistent spacing

**Admin Panel:**
- ✅ **Dashboard** (`/admin`) - Statistics overview with charts and quick actions
- ✅ **Items Management** (`/admin/items`) - Full CRUD operations for data management
- ✅ **Error Handling** - Custom 404 pages for both public and admin sections

**Technical Features:**
- ✅ **HTMX Integration** - Dynamic content loading and auto-refresh
- ✅ **Chart.js Charts** - Interactive pie, bar, and scatter charts
- ✅ **Responsive Design** - Mobile-first responsive layouts
- ✅ **Caching System** - Memory-based caching for performance
- ✅ **Demo Mode** - Offline functionality with dummy data

### **🔧 Recent Improvements**

**Data Management:**
- ✅ **Fixed Admin Count** - Admin now shows all 202 items (was filtering incorrectly)
- ✅ **Consistent Data** - All views now pull from complete dataset
- ✅ **Cache Optimization** - Improved caching strategy for better performance

**User Experience:**
- ✅ **Consistent Spacing** - Fixed header padding across all list pages
- ✅ **Error Pages** - Professional 404 pages with navigation
- ✅ **HTMX Stats Cards** - Auto-refreshing statistics with loading states
- ✅ **Reusable Components** - Shared components for toggle buttons and descriptions

**Code Organization:**
- ✅ **Cleanup** - Removed 8 empty directories and 1 unused file
- ✅ **Structure** - Organized file structure with clear separation
- ✅ **Documentation** - Updated all documentation files

## Architecture Overview

### **🏗️ Server Architecture**
- **Entry Point**: `server.js` - Express.js server with EJS templating
- **Route Separation**: Admin and public routes in separate modules
- **Static Assets**: Organized by section (admin, public, shared)
- **Error Handling**: Comprehensive error handling with custom pages

### **📊 Data Flow**
- **Database**: Firebase Firestore for data storage
- **Caching**: Memory-cache for performance optimization
- **API Endpoints**: RESTful APIs for data access
- **HTMX**: Dynamic content updates without page refresh

### **🎨 Frontend Architecture**
- **Templating**: EJS for server-side rendering
- **Styling**: CSS with responsive design and custom fonts
- **JavaScript**: Modular JS files with Chart.js integration
- **Interactions**: HTMX for dynamic behavior

## Development Guidelines

### **📁 File Organization**
- **Admin Files**: `src/admin/` - Admin panel specific code
- **Public Files**: `src/public/` - Public-facing application
- **Shared Files**: `src/shared/` - Common utilities and configs
- **Documentation**: Root level markdown files

### **🔧 Asset Management**
- **CSS**: Organized by section with responsive breakpoints
- **JavaScript**: Modular files with clear responsibilities
- **Images**: Optimized formats (AVIF, JPG) with proper sizing
- **Fonts**: Custom TBL fonts with proper loading

### **🚀 Deployment**
- **Vercel**: Configured for serverless deployment
- **Environment**: Development and production configurations
- **Caching**: Optimized for CDN and edge caching
- **Performance**: Core Web Vitals optimization

## Running the Application

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start
# or
node server.js

# Access the application
# Public: http://localhost:3000
# Admin: http://localhost:3000/admin
```

## Asset Paths

- **Public CSS**: `/assets/css/style.css`
- **Public JS**: `/assets/js/[filename].js`
- **Admin CSS**: `/admin/assets/css/admin.css`
- **Admin JS**: `/admin/assets/js/[filename].js`
- **Images**: `/assets/images/[filename]`
- **Shared JS**: `/shared/assets/js/[filename].js`

## Development Notes

- **Admin Development**: Work in `src/admin/` (local only)
- **Public Development**: Work in `src/public/` (version controlled)
- **Shared Resources**: Work in `src/shared/` (version controlled)
- **Documentation**: Update root level markdown files
- **Testing**: Use browser dev tools and curl for API testing

---

*Last updated: December 2024*
*Structure reflects current clean, organized codebase*