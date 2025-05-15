export const tagStyles = {
  budget: {
    label: "Budget",
    color: "#d48215"
  },
  classic: {
    label: "Classic",
    color: "#FF6666"
  },
  quick: {
    label: "Quick",
    color: "#CC4444"
  },
  healthy: {
    label: "Healthy",
    color: "#55CC99"
  },
  instant: {
    label: "Instant",
    color: "#3399FF"
  },
  silog: {
    label: "Silog",
    color: "#8399FF"
  },
  dessert: {
    label: "Dessert",
    color: "#ff83bb"
  },
  korean: {
    label: "Korean",
    color: "#171e80"
  },
  japanese: {
    label: "Japanese",
    color: "#801720"
  },
  dafeult: {
    label: "Unknown",
    color: "#999999"
  }
};

export function getTagStyle(typeString) {
    if (typeString && tagStyles[typeString]) {
        return tagStyles[typeString];
    }
    // Fallback for custom primary types or types not in tagStyles
    return {
      label: typeString || 'Misc', // Use the type string itself as label, or 'Misc' if type is empty
      color: '#777777',       // A neutral grey
      textColor: '#FFFFFF'
    };
}