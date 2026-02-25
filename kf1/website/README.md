# Uliunai.lt - Killing Floor Server Website

A modern, responsive website for the longest-running Killing Floor 1 server, built with React, TypeScript, and Tailwind CSS. This website showcases server features, community information, VIP memberships, and provides a platform for players to connect and stay updated.

## 🎮 About

Uliunai.lt is a dedicated Killing Floor 1 server that has been serving the community for over 8 years. This website provides information about the server, its custom content, community features, and ways to support the server through VIP memberships.

## 🛠️ Tech Stack

### Core Technologies

- **React 19.1.0** - Modern React with latest features including concurrent rendering and improved performance
- **TypeScript 5.8.3** - Type-safe development with full type checking and IntelliSense support
- **Vite 7.0.3** - Lightning-fast build tool and development server with HMR (Hot Module Replacement)
- **Tailwind CSS 3.4.17** - Utility-first CSS framework for rapid UI development
- **React Router DOM 7.6.3** - Client-side routing for single-page application navigation

### Additional Libraries

- **i18next 25.4.1** - Internationalization framework for multi-language support
- **react-i18next 15.6.0** - React bindings for i18next
- **i18next-browser-languagedetector 8.2.0** - Automatic language detection from browser settings

### Development Tools

- **ESLint 9.30.1** - Code linting and quality assurance
- **TypeScript ESLint 8.35.1** - TypeScript-specific linting rules
- **PostCSS 8.5.6** - CSS processing with autoprefixer
- **unplugin-auto-import 19.3.0** - Automatic import management

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** - Version 18 or higher (recommended: LTS version)
- **npm** or **yarn** - Package manager (npm comes with Node.js)

You can verify your installation by running:

```bash
node --version
npm --version
```

## 🚀 Getting Started

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd uliunai-kf-website
```

2. Install dependencies:

```bash
npm install
```

This will install all required dependencies listed in `package.json`.

### Development

Start the development server:

```bash
npm run dev
```

The development server will start and display the local URL (typically `http://localhost:5173` or another available port). The server includes:

- **Hot Module Replacement (HMR)** - Changes reflect instantly without full page reload
- **Fast Refresh** - React component state is preserved during updates
- **Source Maps** - Easy debugging with original source code mapping

### Build

Create a production build:

```bash
npm run build
```

The optimized production build will be output to the `dist/` directory. The build includes:

- Minified JavaScript and CSS
- Tree-shaking to remove unused code
- Asset optimization and compression
- Production-ready React code

### Preview

Preview the production build locally:

```bash
npm run preview
```

This serves the production build locally so you can test it before deployment.

## 📁 Project Structure

```
uliunai-kf-website/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── base/           # Base UI components (Button, Card)
│   │   └── feature/        # Feature-specific components (Navigation, Footer, LiveStats)
│   ├── pages/              # Page components
│   │   ├── home/           # Home page and its sections
│   │   │   └── components/ # Home page section components
│   │   └── NotFound.tsx    # 404 error page
│   ├── router/             # Routing configuration
│   │   ├── config.tsx      # Route definitions
│   │   └── index.ts        # Router setup and navigation utilities
│   ├── i18n/               # Internationalization
│   │   ├── index.ts        # i18n configuration
│   │   └── local/          # Translation files
│   ├── App.tsx             # Root application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles and Tailwind imports
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

### Component Organization

- **Base Components** (`src/components/base/`) - Fundamental UI building blocks used throughout the application
- **Feature Components** (`src/components/feature/`) - Complex components with specific functionality
- **Page Components** (`src/pages/`) - Top-level page components that compose sections
- **Section Components** (`src/pages/home/components/`) - Individual sections of the home page

## ✨ Features

### Core Features

- **Responsive Design** - Fully responsive layout that works on desktop, tablet, and mobile devices
- **Modern UI/UX** - Dark horror-themed design with smooth animations and transitions
- **Smooth Scrolling** - Seamless navigation between page sections
- **Live Server Stats** - Real-time display of server status, player count, and current map
- **Contact Form** - Functional contact form with validation and submission handling
- **VIP Membership** - Information and purchase options for VIP tiers
- **Gallery** - Image gallery with lightbox functionality
- **News Section** - Latest server news and announcements
- **Admin Profiles** - Team member profiles and contact information

### Technical Features

- **TypeScript** - Full type safety throughout the codebase
- **Component Documentation** - Comprehensive JSDoc documentation for all components
- **Internationalization Ready** - i18n setup for multi-language support
- **SEO Friendly** - Semantic HTML and proper meta tags
- **Performance Optimized** - Code splitting, lazy loading, and optimized builds
- **Accessibility** - ARIA labels and keyboard navigation support

## 🎨 Styling

The project uses Tailwind CSS for styling with custom configuration:

- **Custom Colors** - Blood red, dark red, and horror gray color palette
- **Custom Fonts** - Orbitron (headings) and Rajdhani (body text)
- **Custom Animations** - Pulse and bounce animations
- **Custom Shadows** - Red glow and blood shadow effects
- **Responsive Breakpoints** - Mobile-first responsive design

Global styles are defined in `src/index.css` including:

- Custom scrollbar styling
- Smooth scrolling behavior
- Selection colors
- Focus styles
- Animation keyframes

## 🌐 Internationalization

The project is set up for internationalization using i18next:

- Translation files are located in `src/i18n/local/[language]/`
- Default language is English (`en`)
- Browser language detection is enabled
- Translation files are automatically loaded using Vite's glob import

To add a new language:

1. Create a new directory in `src/i18n/local/` with the language code
2. Add translation files following the existing structure
3. Translations will be automatically loaded

## 📝 Scripts

Available npm scripts:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔧 Configuration

### Vite Configuration

The Vite configuration (`vite.config.ts`) includes:

- React plugin with SWC for fast compilation
- Base path configuration for deployment
- Build optimization settings

### TypeScript Configuration

TypeScript is configured with:

- Strict type checking
- React JSX support
- Path aliases for cleaner imports
- ES2020 target with modern module resolution

### Tailwind Configuration

Tailwind is configured with:

- Custom color palette
- Custom font families
- Extended animations
- Custom box shadows

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper documentation
4. Ensure all code follows the existing style and includes JSDoc comments
5. Test your changes thoroughly
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Add JSDoc documentation for all functions and components
- Use meaningful variable and function names
- Keep components focused and reusable

## 📄 License

This project is private and proprietary. All rights reserved.

## 📞 Support

For questions, issues, or support:

- **Server IP**: uliunai.lt:7707
- **Discord**: Join our Discord server (link in footer)
- **Steam**: Follow our Steam group (link in footer)

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Bundled with [Vite](https://vitejs.dev/)
- Icons by [RemixIcon](https://remixicon.com/)

---

**Note**: This website is not affiliated with Tripwire Interactive, the developers of Killing Floor.
