# Five Star Pools - Safety Covers Website

A responsive, interactive website for Five Star Pools safety cover configurator and product showcase.

## 🌟 Features

- **Interactive Pool Shape Configurator**: Multi-step workflow for selecting pool covers
- **Shape-Specific Logic**: Different workflows for different pool shapes (Rectangle, Lazy-L, Round, etc.)
- **Responsive Design**: Mobile-friendly layout using CSS Grid
- **Multiple Page Variants**: 
  - Main configurator with full workflow
  - Simple gallery view
  - Quick selector
  - Product catalog
  - Dedicated Lazy-L configurator

## 📁 Project Structure

```
pool/
├── index.html                      # Landing page with navigation
├── safety-covers-template.html     # Main interactive configurator
├── simple-gallery.html             # Basic shape gallery
├── quick-selector.html             # Single-click shape selector
├── product-catalog.html            # E-commerce product listing
├── lazy-l-configurator.html        # Dedicated L-shaped pool configurator
├── images/                         # All product and UI images
│   ├── rectangle.png
│   ├── lazy-l.png
│   ├── [other shape images]
│   ├── [feature icons]
│   └── [installation photos]
└── README.md
```

## 🚀 Quick Start

1. Clone the repository:
```bash
git clone <your-repo-url>
cd pool
```

2. Start a local server:
```bash
python3 -m http.server 8000
```

3. Open your browser to:
```
http://localhost:8000/safety-covers-template.html
```

## 💡 Shape Workflows

The configurator implements different workflows based on pool shape:

- **Rectangle, Grecian, Roman**: Full 4-step workflow (Shape → Corner → Step → Size)
- **Lazy-L**: Custom cover required (Shape → Send Measurements)
- **Round, Oval**: Simplified workflow (Shape → Size, skips corner & step)
- **Square-L**: 3-step workflow (Shape → Step → Size)

## 🎨 Technologies Used

- Pure HTML5/CSS3/JavaScript (no frameworks)
- CSS Grid for responsive layouts
- Vanilla JavaScript for interactivity
- SVG for pool shape diagrams
- Python http.server for local development

## 📝 Customization

To modify the configurator behavior, edit the `shapeWorkflows` object in `safety-covers-template.html`:

```javascript
const shapeWorkflows = {
    'rectangle': { hasCorner: true, hasStep: true, hasSize: true },
    'lazy-l': { hasCorner: false, hasStep: false, hasSize: false, requiresCustom: true },
    // ... add more shapes
};
```

## 📄 License

Private project for Five Star Pools

## 🤝 Contributing

This is a private repository. Contact the repository owner for access.
