# Accessibility Guide - Baithaka GHAR Hotel Booking System

## Overview

This application follows Web Content Accessibility Guidelines (WCAG) 2.1 AA standards to ensure it's usable by everyone, including people with disabilities. This document outlines the accessibility features implemented and how to use them.

## Accessibility Features

### 1. Keyboard Navigation

**Full keyboard support** throughout the application:

- **Tab**: Navigate to the next focusable element
- **Shift + Tab**: Navigate to the previous focusable element
- **Enter/Space**: Activate buttons and links
- **Arrow Keys**: Navigate within menus, lists, and grids
- **Escape**: Close modals, menus, and dismiss notifications
- **Home/End**: Jump to first/last item in lists
- **Page Up/Page Down**: Navigate through long lists or content

### 2. Screen Reader Support

**ARIA labels and landmarks** for screen reader users:

- Semantic HTML structure with proper headings (h1-h6)
- ARIA landmarks: `main`, `navigation`, `banner`, `contentinfo`
- Live regions for dynamic content announcements
- Descriptive labels for all interactive elements
- Status updates announced automatically

### 3. Visual Accessibility

**Multiple display options**:

- **High Contrast Mode**: Enhanced contrast for better visibility
- **Large Text Mode**: Increased font sizes throughout the application
- **Reduced Motion**: Minimizes animations for users sensitive to motion
- **Focus Indicators**: Clear visual focus indicators for keyboard navigation

### 4. Touch and Mobile Accessibility

**Mobile-optimized interactions**:

- Minimum 44px touch targets on all interactive elements
- Adequate spacing between touch targets
- Responsive design that works across all device sizes
- Gesture alternatives for all interactions

## Using Accessibility Features

### Accessing Accessibility Settings

1. Look for the **Accessibility** button (usually in the bottom-right corner)
2. Click or press Enter to open the Accessibility Settings modal
3. Enable or disable features as needed:
   - High Contrast Mode
   - Large Text
   - Reduced Motion
   - Enhanced Focus Indicators
   - Keyboard Navigation optimizations

### Keyboard Shortcuts

#### Global Navigation
- **Alt + M**: Skip to main content
- **Alt + N**: Skip to navigation
- **Tab**: Navigate forward through interactive elements
- **Shift + Tab**: Navigate backward through interactive elements

#### In Forms
- **Tab**: Move to next form field
- **Shift + Tab**: Move to previous form field
- **Enter**: Submit form (when on submit button)
- **Space**: Toggle checkboxes and radio buttons

#### In Modals and Dialogs
- **Escape**: Close modal or dialog
- **Tab**: Cycle through focusable elements within modal
- **Enter**: Activate primary action
- **Space**: Activate buttons

#### In Lists and Menus
- **Arrow Up/Down**: Navigate through list items
- **Arrow Left/Right**: Navigate through horizontal menus
- **Enter/Space**: Select item or open submenu
- **Escape**: Close menu

### Screen Reader Usage

#### Getting Started
1. Enable your screen reader (NVDA, JAWS, VoiceOver, etc.)
2. Use headings navigation to jump between sections
3. Listen for landmark announcements
4. Use form mode for filling out booking forms

#### Key Screen Reader Features
- **Headings List**: Navigate by heading levels (H1-H6)
- **Landmarks**: Jump between page sections
- **Links List**: Browse all links on the page
- **Form Elements**: Navigate through form fields
- **Live Regions**: Hear announcements for status updates

### Form Accessibility

#### Required Fields
- Marked with red asterisk (*) and "required" label
- Screen readers announce field requirements
- Validation errors are announced immediately

#### Error Handling
- Errors are announced as they occur
- Focus moves to first invalid field on form submission
- Clear error messages explain how to fix issues

#### Help Text
- Additional context provided for complex fields
- Associated with form fields for screen readers
- Available both visually and audibly

## Technical Implementation

### Components with Accessibility Features

1. **AccessibleButton**: Enhanced button component with ARIA support
2. **AccessibleModal**: Fully accessible modal dialogs with focus management
3. **AccessibleForm**: Form components with validation and error handling
4. **AccessibleNavigation**: Keyboard-navigable menu systems
5. **AccessibleLoading**: Screen reader announcements for loading states
6. **AccessibleNotifications**: Accessible toast and banner notifications

### Accessibility Hooks

1. **useAccessibility**: Manages accessibility preferences and system detection
2. **useFocusManagement**: Handles focus trapping and restoration
3. **useAriaAnnouncements**: Provides screen reader announcements
4. **useKeyboardNavigation**: Simplifies keyboard event handling

### CSS Classes for Accessibility

```css
.sr-only              /* Screen reader only content */
.skip-link            /* Skip navigation links */
.high-contrast        /* High contrast mode styles */
.large-text           /* Large text mode styles */
.keyboard-navigation  /* Enhanced keyboard focus */
.focus-indicators     /* Visible focus indicators */
```

## Testing Accessibility

### Automated Testing
- Use tools like axe-core, WAVE, or Lighthouse
- Run regular accessibility audits
- Check for ARIA compliance

### Manual Testing

#### Keyboard Testing
1. Unplug your mouse
2. Navigate the entire application using only keyboard
3. Ensure all functionality is accessible
4. Verify focus is always visible

#### Screen Reader Testing
1. Enable a screen reader
2. Navigate through the application
3. Verify all content is announced properly
4. Test form completion and submission

#### Visual Testing
1. Test with high contrast mode enabled
2. Zoom to 200% and verify layout remains usable
3. Test with large text mode
4. Verify color contrast meets WCAG standards

### Mobile Accessibility Testing
1. Test with device accessibility features enabled
2. Verify touch targets are adequately sized
3. Test with voice control (Voice Control on iOS, Voice Access on Android)
4. Ensure content reflows properly when zoomed

## Browser and Assistive Technology Support

### Supported Screen Readers
- **Windows**: NVDA (free), JAWS
- **macOS**: VoiceOver (built-in)
- **iOS**: VoiceOver (built-in)
- **Android**: TalkBack (built-in)

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Support
- iOS 14+ with VoiceOver
- Android 8+ with TalkBack
- Full touch and gesture support

## Common Accessibility Patterns

### Skip Links
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
<a href="#navigation" class="skip-link">Skip to navigation</a>
```

### ARIA Landmarks
```html
<header role="banner">...</header>
<nav role="navigation" aria-label="Main navigation">...</nav>
<main role="main" id="main-content">...</main>
<footer role="contentinfo">...</footer>
```

### Form Labels
```html
<label for="email">Email Address *</label>
<input
  id="email"
  type="email"
  required
  aria-describedby="email-help email-error"
  aria-invalid="false"
/>
<p id="email-help">We'll never share your email</p>
<p id="email-error" role="alert">Please enter a valid email</p>
```

### Live Regions
```html
<div aria-live="polite" aria-atomic="true" id="status"></div>
<div aria-live="assertive" id="errors"></div>
```

## Reporting Accessibility Issues

If you encounter any accessibility barriers:

1. **Document the issue**: Include browser, assistive technology, and steps to reproduce
2. **Contact support**: Report through the accessibility feedback form
3. **Temporary workarounds**: Check if alternative methods are available
4. **Expected timeline**: Most issues are addressed within 48 hours

## Future Enhancements

### Planned Improvements
- Voice command integration
- Additional language support for screen readers
- Enhanced mobile gesture support
- Customizable interface themes
- Advanced keyboard shortcuts

### Accessibility Roadmap
- WCAG 2.2 compliance (when finalized)
- Enhanced cognitive accessibility features
- Improved support for learning disabilities
- Better integration with assistive technologies

## Resources

### External Resources
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

### Tools for Testing
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

---

**Note**: This application is committed to digital accessibility and strives to conform to WCAG 2.1 AA standards. We continuously work to improve accessibility and welcome feedback from all users.