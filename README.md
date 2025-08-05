# LinkedIn Hook LLM Evaluator

A sophisticated Next.js 15 application that provides **comprehensive multi-model analysis** for generating and evaluating high-quality LinkedIn post hooks. Compare multiple AI models with advanced evaluation criteria and get actionable insights.

## 🚀 Key Features

- **Multi-Model Support**: Compare up to 5 different AI models simultaneously (GPT-4o, GPT-4 Turbo, GPT-4, Claude 3.5 Sonnet, Claude 3 Haiku)
- **Advanced Evaluation Pipeline**: 
  - Semantic analysis (curiosity, surprise, FOMO, achievement triggers)
  - Psychological impact assessment (scarcity, authority, social proof)
  - Engagement prediction with virality scoring
  - Industry-specific and audience-targeted evaluation
- **Rich Data Visualization**: 
  - Champion dashboard with performance breakdown
  - Individual hook analysis with detailed metrics
  - Cross-model comparative charts
  - Criteria-by-criteria performance analysis
- **Actionable Intelligence**: AI-generated insights, recommendations, and model selection guidance
- **Professional UI**: Modern dark theme with gradient effects and responsive design

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom dark theme
- **LLM Integration**: OpenAI API (GPT-4o & GPT-4 Turbo)
- **Language**: TypeScript
- **Deployment**: Ready for Vercel/Netlify

## Getting Started

### Prerequisites

- Node.js 18+ 
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd linkedin-hook-llm-eval
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your OpenAI API key to `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Enter a Post Idea**: Input your LinkedIn post concept (e.g., "personal branding with AI in 2025 for B2B companies")

2. **Generate & Compare**: Click the button to generate hooks from both models

3. **Review Results**: Analyze the generated hooks with detailed scoring:
   - English Language Quality
   - Length Optimization (6-12 words)
   - Emotional Appeal
   - LinkedIn Audience Relevance
   - Readability
   - Attention-Grabbing Factor
   - Bonus Points (numbers, data, personal experience)

4. **Compare Performance**: See which model performed better and why

## Evaluation Criteria

### Core Criteria (60 points total)
- **English Language** (10 pts): Grammar, clarity, proper structure
- **Length** (10 pts): Optimal 6-12 word range
- **Emotion** (10 pts): Curiosity, surprise, urgency, excitement
- **LinkedIn Relevance** (10 pts): B2B, professional, growth context
- **Readability** (10 pts): Simple, jargon-free, accessible
- **Attention Grabbing** (10 pts): "Scroll-stopper" potential

### Bonus Criteria (5 points)
- Real results with numbers
- Data-driven insights  
- Personal experience elements

## Project Structure

```
src/
├── app/
│   ├── api/generate-hooks/
│   │   └── route.ts          # API endpoint for LLM calls
│   ├── globals.css           # Custom Tailwind theme
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main application page
├── lib/
│   ├── evaluation-service.ts # Hook scoring algorithm
│   └── llm-service.ts        # OpenAI integration
└── ...
```

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run start    # Start production server
npm run lint     # Run ESLint
```

## API Routes

- `POST /api/generate-hooks` - Generate and evaluate hooks from both models

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run build` 
5. Submit a pull request

## License

MIT License - see LICENSE file for details
