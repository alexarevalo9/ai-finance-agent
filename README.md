# 🤖 AI Finance Agent

A comprehensive AI-powered financial advisor application that helps users create detailed financial profiles, analyze their financial health, and receive personalized financial recommendations.

## 📹 Demo Video

📺 **[Watch the AI Finance Agent in Action](https://drive.google.com/file/d/1mS61QZ-BXrTUfLWADBV_CtKwI69JbpPc/view?usp=sharing)**

## ✨ Features

### 🏦 **Financial Profile Collection**

- **Interactive Chat Interface**: Step-by-step guided conversation to collect comprehensive financial information
- **Structured Data Collection**: Captures personal info, income sources, expenses, debts, savings, and financial goals
- **Real-time Progress Tracking**: Visual progress indicators and session management
- **Persistent Sessions**: Resume conversations with unique session IDs

### 📊 **Financial Health Analysis**

- **AI-Powered Analysis**: Advanced financial metrics calculation using Mastra AI agents
- **Comprehensive Reports**:
  - Debt-to-Income (DTI) ratio analysis
  - Savings rate calculations
  - Emergency fund adequacy assessment
  - Net worth tracking
  - Financial health scoring (A/B/C grades)
  - Personalized recommendations
- **Visual Data Presentation**: Clean, responsive charts and metrics display

### 📁 **Financial Records Management**

- **CSV File Upload**: Import expense and income records via drag-and-drop interface
- **Smart Column Mapping**: Automatic detection and manual mapping of CSV columns
- **Data Validation**: Real-time validation and error handling
- **Batch Processing**: Efficient handling of large financial datasets

### 🔐 **Authentication & Security**

- **Supabase Authentication**: Secure email/password and Google OAuth integration
- **Row Level Security (RLS)**: Database-level security policies
- **User Data Isolation**: Complete data privacy and user separation
- **Session Management**: Secure chat session handling

### 💬 **AI Chat Integration**

- **OpenAI GPT-4 Integration**: Advanced conversational AI capabilities
- **Structured Responses**: AI responses with embedded JSON data for seamless processing
- **Message Persistence**: All conversations saved to database
- **Real-time Interaction**: Smooth chat experience with typing indicators

### 🎨 **Modern UI/UX**

- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Dark/Light Theme**: Modern interface with Tailwind CSS styling
- **Component Library**: Reusable UI components built with Radix UI
- **Accessibility**: WCAG compliant design patterns

## 🛠️ Tech Stack

### **Frontend**

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library

### **Backend & AI**

- **OpenAI GPT-4** - Advanced language model for financial analysis
- **Mastra AI** - AI agent framework for specialized financial tools
- **AI SDK** - Streamlined AI integration with React

### **Database & Authentication**

- **Supabase** - PostgreSQL database with real-time features
- **Supabase Auth** - Authentication and authorization
- **Row Level Security** - Database-level security policies

### **Development Tools**

- **ESLint** - Code linting and quality
- **Turbopack** - Fast development bundler
- **PostCSS** - CSS processing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Supabase account
- OpenAI API key

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-finance-agent
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Google OAuth (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Database Setup

Run the Supabase migrations to set up your database schema:

```bash
# Apply migrations (run in Supabase dashboard or via CLI)
# The migrations are located in supabase/migrations/
```

### 5. Start Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
ai-finance-agent/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── financial-health/     # Financial analysis endpoints
│   │   └── financial-profile/    # Profile collection endpoints
│   ├── auth/                     # Authentication pages
│   ├── chat/                     # Chat session pages
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── ui/                       # Reusable UI components
│   ├── financial-analysis.tsx    # Financial report display
│   ├── financial-profile-collection.tsx  # Main chat interface
│   └── financial-records-upload.tsx      # File upload component
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase client and services
│   └── utils.ts                  # Helper functions
├── mastra/                       # AI agents and workflows
│   ├── agents/                   # Mastra AI agents
│   ├── tools/                    # AI tools and functions
│   └── workflows/                # AI workflows
├── supabase/                     # Database migrations
│   └── migrations/               # SQL migration files
└── hooks/                        # Custom React hooks
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run dev:mastra` - Start Mastra AI development server
- `npm run build:mastra` - Build Mastra AI agents

## 🗄️ Database Schema

The application uses the following main tables:

- **user_profiles** - User financial profile data
- **chat_sessions** - Chat session management
- **chat_messages** - Conversation history storage
- **financial_records** - Uploaded financial data

All tables include Row Level Security (RLS) policies for data protection.

## 🤖 AI Features

### Financial Profile Agent

- Guides users through financial data collection
- Validates and structures user responses
- Maintains conversation context and progress

### Financial Health Analysis Agent

- Calculates key financial metrics
- Generates personalized recommendations
- Provides actionable financial insights

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Supabase Auth** - Secure authentication system
- **Service Role Keys** - Secure API operations
- **Input Validation** - Client and server-side validation
- **CSRF Protection** - Built-in Next.js security

## 📱 Responsive Design

The application is fully responsive and optimized for:

- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a service
- [OpenAI](https://openai.com/) - AI language models
- [Mastra AI](https://mastra.ai/) - AI agent framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - UI primitives

---

**Built with ❤️ using modern web technologies**
