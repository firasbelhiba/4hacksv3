# 4hacks: AI-Powered Hackathon Platform

4hacks is the ultimate hackathon management platform that combines the power of AI evaluation agents with a dynamic tournament bracket system. Streamline your hackathon operations with a single admin interface and let AI handle the heavy lifting of project evaluation.

## ✨ Features

- **🔧 Single Admin Operation**: Streamlined admin interface for effortless hackathon management
- **🤖 6 AI Evaluation Agents**: Advanced AI agents evaluate projects across multiple criteria
- **🏆 Tournament Bracket System**: Dynamic tournament brackets with real-time updates
- **🌙 Dark Mode**: Professional dark theme with gradient animations
- **📱 Responsive Design**: Fully responsive design that works on all devices
- **🎨 Modern UI**: Built with shadcn/ui components and Tailwind CSS

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)
- **Code Quality**: ESLint, Prettier
- **Font**: [Inter](https://fonts.google.com/specimen/Inter)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 4hacks
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx      # Root layout with dark theme
│   ├── page.tsx        # Landing page
│   └── globals.css     # Global styles and animations
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Layout components
│   └── shared/         # Shared components
├── lib/                # Utility functions and constants
│   ├── utils.ts        # cn utility function
│   └── constants.ts    # App constants and configuration
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── styles/             # Additional styles
```

## 🎨 Design System

### Colors
- **Primary**: Indigo (#6366f1)
- **Secondary**: Cyan (#22d3ee)
- **Success**: Emerald (#10b981)
- **Warning**: Amber (#f59e0b)
- **Danger**: Red (#ef4444)

### Animations
- Gradient background animation
- Fade-in animations
- Slide-up animations
- Floating elements
- Hover effects

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) team for the amazing framework
- [shadcn](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide](https://lucide.dev/) for the beautiful icons

---

Built with ❤️ by the 4hacks team
