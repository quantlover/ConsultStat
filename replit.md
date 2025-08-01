# StatConsult Pro - Academic Project Management System

## Overview

StatConsult Pro is a comprehensive project management application designed specifically for statistical consultants and academic researchers. The system provides time tracking, invoice generation, student management, and project oversight capabilities. Built with a modern full-stack architecture, it features a React frontend with TypeScript, an Express.js backend, and PostgreSQL database with Drizzle ORM for type-safe database operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation schemas
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API architecture with consistent error handling
- **Request Logging**: Custom middleware for API request/response logging
- **Development**: Hot module replacement with Vite integration

### Database Architecture
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema changes
- **Validation**: Drizzle-Zod integration for runtime type validation
- **Tables**: Users, projects, students, time entries, invoices, and project-student relationships

### Component Design System
- **Base Components**: Radix UI primitives for accessibility and behavior
- **Design System**: Consistent component variants using class-variance-authority
- **Theme System**: CSS custom properties for light/dark mode support
- **Icons**: Lucide React for consistent iconography
- **Responsive Design**: Mobile-first approach with responsive breakpoints

### Project Structure
- **Monorepo Layout**: Shared schemas between client and server
- **Client Directory**: React application with organized component structure
- **Server Directory**: Express API with separation of concerns
- **Shared Directory**: Type definitions and validation schemas

### Key Features
- **Time Tracking**: Start/stop timers with project association and problem logging
- **Project Management**: CRUD operations for projects with status tracking
- **Student Management**: Academic student records with program and level tracking
- **Invoice Generation**: Automated invoice creation with PDF export capability
- **Dashboard Metrics**: Real-time statistics and project overview
- **Responsive UI**: Mobile-friendly interface with fixed sidebar navigation

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL hosting with connection pooling
- **Environment Variables**: DATABASE_URL for database connection configuration

### Development Tools
- **Replit Integration**: Vite plugins for Replit development environment
- **Error Handling**: Runtime error overlay for development debugging

### UI Libraries
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Lucide React**: Feature-rich icon library
- **date-fns**: Date manipulation and formatting utilities
- **jsPDF**: Client-side PDF generation for invoices

### Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation library
- **Hookform Resolvers**: Integration between React Hook Form and Zod

### Styling and Theming
- **Tailwind CSS**: Utility-first CSS framework
- **clsx and tailwind-merge**: Conditional class name utilities
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### Build and Development
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking and improved developer experience
- **ESBuild**: Fast JavaScript bundler for production builds