# ISIR Conference App - Component Structure

## 📁 Project Structure

````
src/
├── components/          # Reusable UI components
│   ├── Header.jsx
│   ├── HeroSection.jsx
│   ├── Navigation.jsx
│   └── FormComponents.jsx
├── forms/              # Form components
│   ├── VisaRequestForm.jsx
│   └── RegistrationForm.jsx (to be extracted)
├── tabs/               # Tab content components
│   ├── index.js
│   ├── AboutTab.jsx (to be created)
│   ├── CommitteeTab.jsx (to be created)
│   ├── SpeakersTab.jsx (to be created)
│   ├── ScheduleTab.jsx (to be created)
│   ├── SubmissionTab.jsx (to be created)
│   ├── RegistrationTab.jsx (to be created)
│   ├── DeadlinesTab.jsx (to be created)
│   ├── TravelTab.jsx (to be created)
│   └── SponsorsTab.jsx (to be created)
├── config/             # Configuration and constants
│   └── constants.js
├── assets/             # Images and static files
├── App.jsx            # Main application component
├── App.css            # Global styles
└── main.jsx           # Entry point

## 🔄 Refactoring Status

### ✅ Completed
- **components/Header.jsx** - Extracted and ready to use
- **components/HeroSection.jsx** - Extracted and ready to use
- **components/Navigation.jsx** - Extracted and ready to use
- **components/FormComponents.jsx** - Reusable form elements
- **forms/VisaRequestForm.jsx** - Visa request form component
- **config/constants.js** - API config, ticket prices, utility functions

### 🚧 In Progress
- **App.jsx** - Currently imports new components but still contains old definitions
  - Old component definitions need to be removed after verification
  - Tab components still inline (can be extracted gradually)

### 📋 To Do
- Extract all tab components into separate files
- Extract RegistrationForm into forms/RegistrationForm.jsx
- Remove duplicate component definitions from App.jsx
- Create hooks/ directory for custom hooks if needed
- Create utils/ directory for utility functions

## 🎯 Usage

### Importing Components

```javascript
// Components
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import Navigation from "./components/Navigation";
import { FormLabel, FormInput, FormCheckbox, StepIndicator } from "./components/FormComponents";

// Forms
import VisaRequestForm from "./forms/VisaRequestForm";

// Config
import { ISIR_API_CONFIG, TICKET_PRICES, calculateTotalPrice } from "./config/constants";
````

### Component Props

#### Header

```jsx
<Header />
```

No props required - displays ISIR branding and event details.

#### HeroSection

```jsx
<HeroSection onRegisterClick={() => setShowRegistrationForm(true)} />
```

- `onRegisterClick`: Function to call when "Register Now" button is clicked

#### Navigation

```jsx
<Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
```

- `activeTab`: Current active tab ID (string)
- `setActiveTab`: Function to update active tab

#### FormComponents

```jsx
<FormLabel required>Email</FormLabel>
<FormInput name="email" value={value} onChange={onChange} />
<FormCheckbox name="agree" checked={checked} onChange={onChange} label="I agree" />
<StepIndicator currentStep={2} totalSteps={5} />
```

#### VisaRequestForm

```jsx
<VisaRequestForm onClose={() => setShowVisaForm(false)} />
```

- `onClose`: Function to call when form is closed

## 🔧 Configuration

### constants.js exports:

- `ISIR_API_CONFIG` - API endpoint and key configuration
- `TICKET_PRICES` - Pricing structure for all ticket types
- `EARLY_BIRD_DEADLINE` - Date object for early bird cutoff
- `GALA_DINNER_PRICE` - Price for gala dinner add-on
- `getAccompanyingPrice(isEarlyBird)` - Calculate accompanying person price
- `getTicketPrice(ticketType, isEarlyBird)` - Get ticket price
- `calculateTotalPrice(ticketType, accompanyingCount, galaDinner, isEarlyBird)` - Calculate total

## 📝 Next Steps

1. **Gradual Migration**: Extract tab components one at a time to avoid breaking changes
2. **Testing**: Test each extracted component thoroughly
3. **Cleanup**: Remove old component definitions from App.jsx once replacements are verified
4. **Documentation**: Add JSDoc comments to all components
5. **Optimization**: Implement React.memo where appropriate for performance

## 🎨 Styling

All components use:

- Tailwind CSS utility classes
- CSS custom properties (--color-primary, --color-secondary)
- App.css for global styles and custom classes

## 🚀 Benefits of New Structure

1. **Modularity**: Each component is self-contained and reusable
2. **Maintainability**: Easier to find and update specific features
3. **Testability**: Individual components can be tested in isolation
4. **Collaboration**: Multiple developers can work on different components
5. **Performance**: Easier to implement code-splitting and lazy loading
6. **Scalability**: Simple to add new features without bloating main file
