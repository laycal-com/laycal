# Blog Writing Guide for Laycal

This comprehensive guide covers how to write and format blog posts for the Laycal platform using Markdown with MDX support.

## Table of Contents

1. [Getting Started](#getting-started)
2. [File Structure](#file-structure)
3. [Frontmatter Configuration](#frontmatter-configuration)
4. [Text Formatting](#text-formatting)
5. [Images](#images)
6. [Videos](#videos)
7. [Lists](#lists)
8. [Links and URLs](#links-and-urls)
9. [Code Blocks](#code-blocks)
10. [Blockquotes](#blockquotes)
11. [URL Fragments (Jump Links)](#url-fragments-jump-links)
12. [Best Practices](#best-practices)
13. [SEO Optimization](#seo-optimization)

## Getting Started

All blog posts are stored as Markdown files (`.md`) in the `/blogs/` directory. The system uses MDX, which allows you to use React components within your Markdown content.

## File Structure

Create a new file in `/blogs/` with a descriptive filename:
```
/blogs/your-blog-post-title.md
```

The filename becomes the URL slug: `/blogs/your-blog-post-title`

## Frontmatter Configuration

Every blog post must start with frontmatter (metadata) in YAML format:

```yaml
---
title: "Your Blog Post Title"
description: "A compelling description that appears in search results and social shares"
author: "Author Name"
category: "Category Name"
publishedAt: "2024-03-15"
image: "https://example.com/featured-image.jpg"
featured: false
tags: ["tag1", "tag2", "tag3"]
readTime: "5 min read"
---
```

### Frontmatter Fields Explained:

- **title**: The main heading of your blog post (appears in browser tab and social shares)
- **description**: Meta description for SEO and social media previews (150-160 characters recommended)
- **author**: Name of the author
- **category**: Used for grouping related posts (e.g., "Healthcare Industry", "Sales Tips", "AI Technology")
- **publishedAt**: Publication date in YYYY-MM-DD format
- **image**: Featured image URL (used in blog listing and social shares)
- **featured**: Boolean - set to `true` to highlight in featured section
- **tags**: Array of relevant tags for categorization and SEO
- **readTime**: Estimated reading time (calculate ~200 words per minute)

## Text Formatting

### Headings

The system automatically generates clickable anchor links for all headings:

```markdown
# Main Title (H1) - Usually the article title
## Section Title (H2) - Major sections
### Subsection Title (H3) - Subsections
```

**URL Fragment Support**: All headings automatically get URL fragments. For example:
- `## Current Applications` becomes `#current-applications`
- `### 24/7 Customer Support` becomes `#247-customer-support`

### Text Styling

```markdown
**Bold text**
*Italic text*
***Bold and italic***
`Inline code`
```

### Paragraphs

Simply write paragraphs separated by blank lines:

```markdown
This is the first paragraph with some content.

This is the second paragraph. The system automatically applies proper spacing and typography.
```

## Images

### Basic Image Syntax

```markdown
![Alt text description](https://example.com/image.jpg)
```

**Important**: Images are automatically rendered as `<figure>` elements to ensure proper HTML structure and avoid hydration errors.

### Image Best Practices

1. **Use descriptive alt text** for accessibility
2. **Optimize image size** - recommended max width: 1200px
3. **Use appropriate formats**: JPEG for photos, PNG for graphics, WebP for modern browsers
4. **Host externally** or place in `/public/assets/blogs/`

```markdown
![AI Voice Technology Dashboard showing real-time call analytics](https://example.com/dashboard-screenshot.jpg)
```

### Local Images

Store images in `/public/assets/blogs/` and reference them:

```markdown
![Local image example](/assets/blogs/my-image.jpg)
```

## Videos

### YouTube Videos

For YouTube videos, use the iframe syntax with YouTube embed URLs:

```markdown
<iframe 
  src="https://www.youtube.com/embed/VIDEO_ID" 
  title="Video title description"
  width="560" 
  height="315">
</iframe>
```

The system automatically:
- Creates responsive video containers using `<figure>` elements
- Adds proper aspect ratios
- Includes accessibility attributes
- Shows video titles as captions using `<figcaption>`
- Ensures proper HTML structure to prevent hydration errors

### Other Video Platforms

For other video platforms, use the standard iframe syntax:

```markdown
<iframe 
  src="https://vimeo.com/embed/VIDEO_ID" 
  title="Video description"
  width="560" 
  height="315">
</iframe>
```

## Lists

### Unordered Lists (Bullets)

```markdown
- First item
- Second item
- Third item
  - Nested item
  - Another nested item
```

### Ordered Lists (Numbers)

```markdown
1. First step
2. Second step
3. Third step
   1. Sub-step A
   2. Sub-step B
```

### Advanced List Formatting

```markdown
### Key Benefits:

- **Increased Efficiency**: Up to 40% faster than traditional methods
- **Better Accuracy**: AI reduces human error in data entry
- **Cost Savings**: Reduces operational costs by 60%
- **24/7 Availability**: Never stops working, unlike human operators
```

## Links and URLs

### Internal Links (Within Your Site)

```markdown
[Link to another blog post](/blogs/other-post-title)
[Link to pricing page](/pricing)
[Link to dashboard](/dashboard)
```

### External Links

```markdown
[External website](https://example.com)
[Research study](https://research.example.com/study)
```

### Reference Links

For cleaner markdown, use reference-style links:

```markdown
This is a paragraph with a [link to research][1] and another [link to documentation][2].

[1]: https://research.example.com/ai-study
[2]: https://docs.example.com/api
```

### Email Links

```markdown
[Contact our support team](mailto:support@laycal.com)
```

## Code Blocks

### Inline Code

Use backticks for `inline code` within sentences.

### Code Blocks

Use triple backticks with language specification:

```markdown
```javascript
function makeCall(phoneNumber) {
  return aiVoiceAgent.call({
    to: phoneNumber,
    message: "Hello, this is an automated call..."
  });
}
```
```

```markdown
```python
import requests

def schedule_appointment(lead_data):
    response = requests.post('/api/appointments', json=lead_data)
    return response.json()
```
```

### Supported Languages

The system supports syntax highlighting for:
- `javascript`, `js`
- `python`, `py` 
- `typescript`, `ts`
- `html`
- `css`
- `json`
- `bash`, `shell`
- `sql`

## Blockquotes

### Basic Blockquotes

```markdown
> "AI voice technology has revolutionized our sales process, increasing our conversion rate by 300%."
```

### Attributed Quotes

```markdown
> "The future of sales is AI-powered conversations that feel completely natural and engaging."
> 
> — John Smith, CEO of SalesForce Inc.
```

### Multi-paragraph Quotes

```markdown
> This is the first paragraph of a longer quote.
> 
> This is the second paragraph of the same quote, providing additional context and detail.
```

## URL Fragments (Jump Links)

**Yes, the blog system supports URL fragments!** 

### Automatic Generation

All headings automatically get URL-friendly IDs:
- `## Current Applications` → `#current-applications`
- `### 24/7 Customer Support` → `#247-customer-support`
- `### AI-Powered Analytics` → `#ai-powered-analytics`

### Usage

Users can link directly to sections:
```
https://laycal.com/blogs/ai-voice-healthcare#current-applications
```

### Creating Manual Anchors

You can also create custom anchor points:

```markdown
<a id="custom-section"></a>
## My Custom Section

Content here can be accessed via #custom-section
```

### Table of Contents

Create a table of contents with jump links:

```markdown
## Table of Contents

1. [Introduction](#introduction)
2. [Key Benefits](#key-benefits)
3. [Implementation Guide](#implementation-guide)
4. [Conclusion](#conclusion)
```

## Best Practices

### Content Structure

1. **Hook readers early** - Start with a compelling problem or statistic
2. **Use descriptive headings** - They become navigation anchors
3. **Break up long paragraphs** - Aim for 2-4 sentences per paragraph
4. **Include actionable insights** - Give readers something they can implement
5. **End with a call-to-action** - Guide readers to the next step

### Writing Style

```markdown
### Good Example:
## How AI Voice Agents Increase Sales Conversions by 300%

Sales teams struggle with inconsistent messaging and limited calling hours. Our AI voice technology solves both problems by delivering perfect scripts 24/7.

### Key Benefits:
- **Consistent messaging** across all calls
- **24/7 availability** for global time zones
- **Scalable operations** without hiring costs

### Poor Example:
## AI is Good for Sales

AI helps with sales. It can make calls and talk to people. This is useful for businesses.
```

### SEO Optimization

1. **Use target keywords** in title, headings, and naturally throughout content
2. **Write compelling meta descriptions** (150-160 characters)
3. **Include relevant tags** for categorization
4. **Use descriptive image alt text**
5. **Link to related internal content**

### Content Length

- **Minimum**: 800 words for SEO effectiveness
- **Optimal**: 1,500-2,500 words for comprehensive coverage
- **Maximum**: No limit, but ensure quality over quantity

## Example Blog Post Structure

```markdown
---
title: "How AI Voice Agents Transform Healthcare Communication"
description: "Discover how AI voice technology is revolutionizing patient communication, reducing wait times, and improving healthcare outcomes across the industry."
author: "Healthcare Technology Expert"
category: "Healthcare Industry"
publishedAt: "2024-03-15"
image: "/assets/blogs/healthcare-ai-communication.jpg"
featured: true
tags: ["healthcare", "AI voice", "patient communication", "healthcare technology", "automation"]
readTime: "8 min read"
---

# How AI Voice Agents Transform Healthcare Communication

The healthcare industry faces unprecedented challenges in patient communication. With staff shortages and increasing patient volumes, traditional communication methods are falling short.

## Table of Contents

1. [The Current Communication Crisis](#the-current-communication-crisis)
2. [AI Voice Solutions in Action](#ai-voice-solutions-in-action)
3. [Implementation Results](#implementation-results)
4. [Getting Started Guide](#getting-started-guide)

## The Current Communication Crisis

Healthcare providers report several critical issues:

- **78% increase** in patient call volume
- **45 minute average** wait times for appointments
- **30% of calls** go unanswered during peak hours

> "We were losing patients because they couldn't reach us when they needed care most."
> — Dr. Sarah Johnson, Metro Health Clinic

## AI Voice Solutions in Action

### Appointment Scheduling

AI voice agents handle routine scheduling tasks:

```javascript
// Example API integration
const scheduleAppointment = async (patientData) => {
  return await aiAgent.call({
    objective: "schedule_appointment",
    patientInfo: patientData,
    availableSlots: getOpenSlots()
  });
};
```

### Benefits Include:

- **24/7 availability** for patient convenience
- **Instant confirmation** with calendar integration
- **Automated reminders** to reduce no-shows

![AI Healthcare Dashboard showing appointment analytics](/assets/blogs/healthcare-dashboard.jpg)

### Patient Triage and Support

Modern AI systems provide intelligent patient triage:

1. **Symptom assessment** using medical protocols
2. **Urgency classification** for proper routing
3. **Care coordination** with medical staff

<iframe 
  src="https://www.youtube.com/embed/example-video-id" 
  title="AI Voice Triage System Demo">
</iframe>

## Implementation Results

Healthcare organizations using AI voice agents report:

| Metric | Before AI | After AI | Improvement |
|--------|-----------|----------|-------------|
| Call Answer Rate | 70% | 95% | +25% |
| Average Wait Time | 45 min | 2 min | -43 min |
| Patient Satisfaction | 6.2/10 | 8.9/10 | +2.7 points |

## Getting Started Guide

### Step 1: Assessment

Evaluate your current communication challenges:
- Call volume analysis
- Peak time identification
- Staff capacity review

### Step 2: Integration

Work with our team to integrate AI voice technology:
- System configuration
- Staff training
- Gradual rollout

### Step 3: Optimization

Monitor and improve performance:
- Analytics review
- Patient feedback collection
- Continuous refinement

## Conclusion

AI voice technology isn't just changing healthcare communication—it's saving lives by ensuring patients can access care when they need it most.

Ready to transform your healthcare communication? [Contact our healthcare specialists](/contact) to learn how AI voice agents can improve your patient experience.

---

*This article was written by our healthcare technology team. For more insights on AI in healthcare, subscribe to our newsletter below.*
```

## Publishing Your Blog Post

1. **Create the markdown file** in `/blogs/` directory
2. **Test locally** by running the development server
3. **Review the content** at `http://localhost:3000/blogs/your-slug`
4. **Check all links and images** work properly
5. **Verify SEO metadata** appears correctly
6. **Test URL fragments** by clicking heading links

Your blog post will automatically:
- Appear in the blog listing at `/blog`
- Be available at `/blogs/your-filename` (without the .md extension)
- **Get added to the sitemap.xml** for search engine discovery
- Use the file modification date as the `lastModified` date in the sitemap
- Receive higher search priority if marked as `featured: true`

## Need Help?

If you encounter issues or need assistance with blog formatting, refer to the codebase documentation or contact the development team.