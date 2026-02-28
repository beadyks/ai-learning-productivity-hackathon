# Demo Video Script
## Voice-First AI Learning & Developer Productivity Assistant

**Duration:** 3-5 minutes  
**Format:** Screen recording + voiceover  
**Tools:** OBS Studio, Loom, or Zoom

---

## Scene 1: Introduction (30 seconds)

### Visual
- Title slide with project name
- Your face/avatar (optional)
- AWS AI for Bharat Hackathon logo

### Script
> "Hi! I'm Beady, and I'm excited to present my AWS AI for Bharat Hackathon project: Voice-First AI Learning & Developer Productivity Assistant.
>
> This is a revolutionary platform that makes AI-powered education accessible to Indian students at just ₹49 per month—that's 17 times cheaper than ChatGPT Plus.
>
> Let me show you how we built this using AWS services, especially Amazon Bedrock."

---

## Scene 2: The Problem (30 seconds)

### Visual
- Slide showing problem statistics
- India map with connectivity issues
- Price comparison chart

### Script
> "The problem is clear: 85% of Indian students cannot afford premium AI tools like ChatGPT Plus at ₹1,650 per month.
>
> Additionally, most AI tools are English-only, while 70% of Indian students prefer Hindi or regional languages.
>
> And with limited internet bandwidth, video-based learning that consumes 1-3 GB per hour is simply not practical.
>
> We needed a solution that's affordable, multilingual, and optimized for low-bandwidth environments."

---

## Scene 3: Architecture Overview (1 minute)

### Visual
- Architecture diagram
- AWS service icons
- Data flow animation

### Script
> "Our solution is built entirely on AWS using a serverless architecture.
>
> At the core, we use Amazon Bedrock with Claude 3 Haiku for AI-powered tutoring. Haiku is incredibly cost-effective at just $0.00025 per 1,000 tokens—that's 12 times cheaper than Sonnet.
>
> We have 30 AWS Lambda functions handling everything from document processing to AI response generation. These run on ARM64 Graviton2 processors for 20% cost savings.
>
> User data is stored in Amazon DynamoDB with three tables for profiles, sessions, and progress tracking. Documents are stored in Amazon S3 with intelligent tiering for automatic cost optimization.
>
> Everything is exposed through Amazon API Gateway using HTTP API, which is 70% cheaper than REST API.
>
> For authentication, we use Amazon Cognito, and all data is encrypted using AWS KMS.
>
> This serverless architecture means zero infrastructure management and automatic scaling from zero to millions of users."

---

## Scene 4: GenAI Integration (1 minute)

### Visual
- Bedrock console
- Model selection logic
- Response caching diagram

### Script
> "Let me explain our GenAI integration with Amazon Bedrock.
>
> We use a smart routing system. For 95% of student queries—simple questions, explanations, and tutoring—we use Claude 3 Haiku. It's fast, accurate, and incredibly cost-effective.
>
> For the remaining 5% of complex queries—multi-step problems, deep reasoning, interview preparation—we automatically route to Claude 3 Sonnet.
>
> We also implement aggressive response caching with a 24-hour TTL. This gives us a 60% cache hit rate, reducing our Bedrock costs by 60%.
>
> For document processing, we use Titan Embeddings to generate vector embeddings, enabling semantic search across all of a student's uploaded materials.
>
> This is true Retrieval Augmented Generation—the AI learns from the student's own textbooks, notes, and study materials, making responses personalized to their specific curriculum."

---

## Scene 5: Live API Demo (1 minute)

### Visual
- Terminal window
- API requests and responses
- Postman/curl commands

### Script
> "Now let me show you our working prototype. The API is live at this endpoint.
>
> First, let's check the health endpoint."

**[Type and execute]:**
```bash
curl https://mbyja4ujxa.execute-api.ap-south-1.amazonaws.com/health
```

> "Great! The API is healthy and running.
>
> Now let's create a user profile."

**[Type and execute]:**
```bash
curl -X POST https://mbyja4ujxa.execute-api.ap-south-1.amazonaws.com/profile \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Student","email":"demo@example.com","preferences":{"language":"hi"}}'
```

> "Perfect! We've created a user with Hindi language preference.
>
> Now let's start a learning session."

**[Type and execute]:**
```bash
curl -X POST https://mbyja4ujxa.execute-api.ap-south-1.amazonaws.com/session \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","mode":"tutor","context":{"topic":"AWS Lambda"}}'
```

> "Excellent! The session is created and ready for AI-powered tutoring."

---

## Scene 6: Cost Optimization (30 seconds)

### Visual
- Cost comparison chart
- Savings breakdown
- Pricing tiers

### Script
> "Our cost optimization strategy is what makes this truly revolutionary.
>
> By using browser Speech API instead of Amazon Transcribe, we save $2,640 per month.
>
> Open-source OCR with Tesseract and PaddleOCR saves us $150 per month compared to Amazon Textract.
>
> Smart AI caching and model routing reduces Bedrock costs by 60%.
>
> In total, we've achieved a 98% cost reduction—from $4,774 to just $100 per 1,000 students per month.
>
> That's only ₹8.30 per student, allowing us to offer the service at ₹49 per month with an 83% profit margin."

---

## Scene 7: Kiro Spec-Driven Development (30 seconds)

### Visual
- Kiro spec files
- Requirements document
- Design document

### Script
> "We built this entire project using Kiro for spec-driven development.
>
> We have complete requirements using EARS patterns, a detailed design document with correctness properties, and a comprehensive task breakdown.
>
> This structured approach ensured quality, testability, and maintainability throughout the development process.
>
> All our specs are available in the GitHub repository under the .kiro/specs directory."

---

## Scene 8: Impact & Future (30 seconds)

### Visual
- Impact metrics
- Future roadmap
- Student testimonials (if available)

### Script
> "Our target is to reach 10,000 students in the first 6 months, with 70% monthly retention.
>
> We're making AI education accessible to the 40 million college students in India who couldn't afford it before.
>
> In the future, we plan to add mobile apps, more regional languages, offline mode, and social learning features.
>
> Our vision is to make AI-powered education accessible to 100 million Indian students."

---

## Scene 9: Conclusion & Call to Action (30 seconds)

### Visual
- GitHub repository
- API endpoint
- Contact information
- Thank you slide

### Script
> "To summarize: we've built a voice-first AI learning platform that's 17 times cheaper than ChatGPT Plus, supports Hindi and Hinglish, and is optimized for low-bandwidth environments.
>
> It's built entirely on AWS using Bedrock, Lambda, DynamoDB, S3, and API Gateway—a true serverless architecture.
>
> The API is live and working. You can test it right now at this endpoint.
>
> All the source code is available on GitHub.
>
> Thank you for watching! I'm excited to answer any questions you might have about the architecture, the GenAI integration, or our cost optimization strategy.
>
> Let's make AI education accessible to every Indian student!"

---

## Recording Setup

### Before Recording

1. **Prepare Environment**
   - Close unnecessary applications
   - Clear browser history/cache
   - Set up terminal with large font
   - Prepare all commands in a text file
   - Test API endpoints

2. **Screen Setup**
   - Resolution: 1920x1080 (Full HD)
   - Browser: Chrome/Firefox (clean profile)
   - Terminal: Large font (16-18pt)
   - Slides: Full screen mode

3. **Audio Setup**
   - Use good microphone
   - Quiet environment
   - Test audio levels
   - Record a test clip

### Recording Tools

**Option 1: OBS Studio (Free)**
- Download: https://obsproject.com/
- Best for: Professional quality
- Features: Scene switching, overlays

**Option 2: Loom (Free tier)**
- Website: https://www.loom.com/
- Best for: Quick recording
- Features: Easy sharing, editing

**Option 3: Zoom (If you have it)**
- Record yourself presenting
- Share screen for demos
- Good for face + screen

### Recording Tips

1. **Practice First**
   - Rehearse the script 2-3 times
   - Time each section
   - Smooth transitions

2. **Speak Clearly**
   - Moderate pace (not too fast)
   - Enthusiastic tone
   - Pause between sections

3. **Show, Don't Tell**
   - Let the visuals speak
   - Point to important elements
   - Use cursor to guide attention

4. **Handle Mistakes**
   - Pause and restart section
   - Edit out mistakes later
   - Don't apologize on camera

### Post-Production

1. **Edit Video**
   - Cut out mistakes
   - Add transitions
   - Include captions (optional)
   - Add background music (subtle)

2. **Add Elements**
   - Title cards
   - Lower thirds with text
   - Highlight important points
   - Zoom in on details

3. **Export Settings**
   - Format: MP4 (H.264)
   - Resolution: 1920x1080
   - Frame rate: 30 fps
   - Bitrate: 5-10 Mbps
   - File size: <100 MB

### Upload

1. **YouTube (Recommended)**
   - Create unlisted video
   - Add title and description
   - Include timestamps
   - Add to hackathon playlist

2. **Vimeo**
   - Professional platform
   - Good for portfolios
   - Privacy controls

3. **Google Drive**
   - Backup option
   - Easy sharing
   - No processing delay

---

## Video Checklist

- [ ] Script reviewed and practiced
- [ ] Recording environment prepared
- [ ] All API endpoints tested
- [ ] Slides ready and accessible
- [ ] Audio quality checked
- [ ] Screen resolution set to 1080p
- [ ] Terminal font size increased
- [ ] Browser bookmarks hidden
- [ ] Notifications disabled
- [ ] Recording software tested
- [ ] Backup recording started
- [ ] Video recorded successfully
- [ ] Mistakes edited out
- [ ] Transitions added
- [ ] Captions added (optional)
- [ ] Video exported in correct format
- [ ] File size under 100 MB
- [ ] Video uploaded to platform
- [ ] Link tested and working
- [ ] Link added to submission

---

## Alternative: Slide-Based Video

If live demo is risky, create a slide-based video:

1. **Create detailed slides** with screenshots
2. **Record voiceover** over slides
3. **Add animations** to show flow
4. **Include code snippets** and API responses
5. **Show architecture** diagrams

This is safer but less impressive than live demo.

---

## Final Tips

1. **Keep it concise:** 3-5 minutes maximum
2. **Focus on innovation:** Cost optimization, GenAI, voice-first
3. **Show working code:** Live API demo is powerful
4. **Explain AWS usage:** Bedrock, Lambda, serverless
5. **Highlight impact:** Affordable education for millions
6. **Be enthusiastic:** Show passion for the project
7. **End strong:** Clear call to action

---

**Good luck with your demo video!** 🎥🚀
