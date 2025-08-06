export interface ScrollUtils {
  scrollToSection: (elementId: string) => void;
  scrollToTop: () => void;
}

export function useScrollUtils(): ScrollUtils {
  const scrollToSection = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      const offset = 100; // Account for sticky header + some padding
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    scrollToSection,
    scrollToTop,
  };
}