# Next.js SaaS Template

A complete SaaS template built with Next.js 15, TypeScript, Clerk authentication, and PayPal payments integration.

## Features

- 🔐 **Authentication** - Clerk for secure user management
- 💳 **Payments** - PayPal integration for subscriptions
- 🎨 **Styling** - Tailwind CSS for modern UI
- 📱 **Responsive** - Mobile-first design
- 🔒 **Protected Routes** - Middleware-based route protection
- 📊 **Dashboard** - User dashboard with account management
- 💰 **Pricing Page** - Subscription plans with PayPal buttons

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` - Your PayPal client ID
- `PAYPAL_CLIENT_SECRET` - Your PayPal client secret

### 3. Set up Clerk

1. Create an account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your publishable key and secret key to `.env.local`
4. Configure sign-in/sign-up URLs in Clerk dashboard:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`

### 4. Set up PayPal

1. Create a developer account at [developer.paypal.com](https://developer.paypal.com)
2. Create a new application
3. Copy your client ID and secret to `.env.local`
4. Set up subscription plans in PayPal dashboard (optional)
5. Configure webhook URL: `your-domain.com/api/webhooks/paypal`

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── webhooks/paypal/     # PayPal webhook handler
│   ├── dashboard/               # Protected dashboard page
│   ├── pricing/                 # Pricing page with PayPal integration
│   ├── layout.tsx              # Root layout with Clerk provider
│   └── page.tsx                # Landing page
├── components/
│   └── PayPalProvider.tsx      # PayPal script provider
├── middleware.ts               # Route protection middleware
└── ...
```

## Customization

### Adding New Pages

1. Create new pages in the `src/app` directory
2. Update middleware.ts if the page needs protection
3. Add navigation links as needed

### Styling

The template uses Tailwind CSS. Customize the design by:

1. Modifying `tailwind.config.js`
2. Updating component styles
3. Adding custom CSS in `globals.css`

### Payment Plans

Update the pricing plans in `src/app/pricing/page.tsx`:

```typescript
const plans = [
  {
    name: "Your Plan",
    price: "$X",
    period: "/month",
    features: ["Feature 1", "Feature 2"],
    paypalPlanId: "your-paypal-plan-id",
  },
];
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Ensure you:
1. Set all environment variables
2. Configure webhook URLs for PayPal
3. Update Clerk dashboard with production URLs

## Security Notes

- Never commit `.env.local` to version control
- Use different API keys for development and production
- Set up proper webhook verification for PayPal
- Configure CORS and rate limiting for production

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Clerk Documentation](https://clerk.com/docs) - authentication and user management
- [PayPal Developer Documentation](https://developer.paypal.com/docs/) - payment integration
- [Tailwind CSS](https://tailwindcss.com/docs) - utility-first CSS framework

## License

MIT License - feel free to use this template for your projects.
