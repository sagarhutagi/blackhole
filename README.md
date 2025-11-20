# Black Hole 🕳️

> The anonymous social network for your campus. Share confessions, ideas, and hot takes without leaving your identity behind.

## Features

- **Anonymous Posting**: Post messages without revealing your identity
- **Confessions**: A dedicated space for personal confessions
- **Hashtag Groups**: Create and join topic-based groups with real-time updates
- **Hall of Fame**: See the most popular posts based on reactions
- **Real-time Updates**: Instant message delivery and reactions using Supabase Realtime
- **Online Status**: See how many students are currently online
- **Daily Purge**: All messages are automatically purged at midnight IST
- **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS + PostCSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Real-time**: Supabase Realtime subscriptions
- **Package Manager**: npm

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd UniVerse
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. **Run development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/        # React components
│   ├── AuthGate.tsx
│   ├── ChatInterface.tsx
│   ├── Sidebar.tsx
│   ├── HallOfFame.tsx
│   └── ...
├── lib/              # Utilities and services
│   ├── supabase.ts   # Supabase client
│   ├── utils.ts      # Helper functions
│   └── hashtags.ts   # Hashtag management
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## Database Schema

The application uses PostgreSQL with the following main tables:

- `messages` - User messages with reactions and metadata
- `hashtag_groups` - Active hashtag groups with message counts
- `auth.users` - Supabase authentication

See `supabase_schema.sql` for complete schema.

## Features Breakdown

### Anonymous Identity
- Each user gets a randomly generated username and color
- Username is stored in localStorage and Supabase user metadata
- Completely anonymous - no IP tracking or session identifiers

### Messaging
- Text messages and confessions
- Hashtag support for topic organization
- Reply functionality (prepared for implementation)
- Emoji reactions
- Message reporting system

### Real-time Updates
- Instant message delivery across all clients
- Live reaction counts
- Online user presence tracking
- Hall of Fame updates in real-time

### Daily Purge
- All messages automatically deleted at midnight IST
- Hashtag groups cleaned up if inactive for 30+ minutes
- User activity tracked and managed

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

### Quick Deploy to Netlify

Push to GitHub and connect to Netlify - automatic deployments enabled.

## Environment Variables

Required environment variables (see `.env.example`):

```
VITE_SUPABASE_URL       # Your Supabase project URL
VITE_SUPABASE_ANON_KEY  # Supabase anonymous key
```

## API Integration

All backend operations go through Supabase:

- Authentication (Sign up/Sign in)
- Database operations (CRUD)
- Real-time subscriptions
- File storage (if needed)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Optimized bundle size (~150KB gzipped)
- Code splitting for vendor libraries
- Lazy loading of components
- Efficient database queries with RLS policies
- Real-time updates using WebSockets

## Security

- Row Level Security (RLS) on all database tables
- Email verification for new accounts
- Password hashing via Supabase Auth
- No sensitive data stored in localStorage
- Input validation and sanitization
- CSRF protection via Supabase

## Rate Limiting

- 1 hashtag group creation per user per 24 hours
- Message posting rate limited by database write capacity
- Configurable via RLS policies

## Troubleshooting

### App not connecting to Supabase
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in `.env.local`
- Check if Supabase project is active
- Ensure tables are created from `supabase_schema.sql`

### Messages not appearing
- Check browser console for errors
- Verify RLS policies allow your user role
- Ensure real-time is enabled on the messages table

### Authentication issues
- Clear browser cache and localStorage
- Check email confirmation status
- Verify authentication settings in Supabase

See [DEPLOYMENT.md](./DEPLOYMENT.md) for more troubleshooting tips.

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Acknowledgments

- Supabase for backend infrastructure
- Vercel for deployment platform
- Tailwind CSS for styling framework
- React community for excellent tools and libraries

---

Built with ❤️ for Campus Conversations
