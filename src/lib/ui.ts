import type {
  Notification,
  NotificationType,
  VisualEffect,
  EffectType,
  Dialogue,
  DialogueOption,
  GameState,
  Player,
  InventoryItem,
  Room,
  GameSettings,
  Difficulty,
} from "@/types";

// UI Theme Configuration
interface UITheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    danger: string;
    warning: string;
    success: string;
    info: string;
    health: string;
    sanity: string;
    energy: string;
    shadow: string;
    glow: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    glow: string;
    horror: string;
  };
  animations: {
    fast: string;
    normal: string;
    slow: string;
  };
}

// Horror-themed UI theme
export const horrorTheme: UITheme = {
  colors: {
    primary: "#8B0000", // Dark red
    secondary: "#2F1B14", // Dark brown
    background: "#0A0A0A", // Almost black
    surface: "#1A1A1A", // Dark gray
    text: "#E0E0E0", // Light gray
    textSecondary: "#A0A0A0", // Medium gray
    accent: "#FF6B6B", // Bright red
    danger: "#DC2626", // Red
    warning: "#F59E0B", // Orange
    success: "#10B981", // Green
    info: "#3B82F6", // Blue
    health: "#EF4444", // Red for health
    sanity: "#8B5CF6", // Purple for sanity
    energy: "#F59E0B", // Orange for energy
    shadow: "rgba(0, 0, 0, 0.8)",
    glow: "#FF0000", // Red glow
  },
  fonts: {
    primary: '"Creepster", "Chiller", cursive',
    secondary: '"Roboto", sans-serif',
    monospace: '"Courier New", monospace',
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    xxl: "3rem",
  },
  borderRadius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "1rem",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.5)",
    md: "0 4px 6px rgba(0, 0, 0, 0.7)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.8)",
    glow: "0 0 20px rgba(255, 0, 0, 0.5)",
    horror: "0 0 30px rgba(139, 0, 0, 0.8), inset 0 0 20px rgba(0, 0, 0, 0.9)",
  },
  animations: {
    fast: "0.15s ease-in-out",
    normal: "0.3s ease-in-out",
    slow: "0.6s ease-in-out",
  },
};

// Notification Manager
class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private container?: HTMLElement;
  private maxNotifications = 5;

  constructor() {
    this.createContainer();
  }

  private createContainer(): void {
    if (typeof window === "undefined") return;

    this.container = document.createElement("div");
    this.container.id = "notification-container";
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
      max-width: 400px;
    `;
    document.body.appendChild(this.container);
  }

  show(notification: Omit<Notification, "id" | "timestamp">): string {
    const id = `notification_${Date.now()}_${Math.random()}`;
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
      duration: notification.duration || 5000,
    };

    this.notifications.set(id, fullNotification);
    this.renderNotification(fullNotification);

    // Auto-remove after duration
    if (fullNotification.duration && fullNotification.duration > 0) {
      setTimeout(() => this.remove(id), fullNotification.duration);
    }

    // Limit number of notifications
    this.limitNotifications();

    return id;
  }

  remove(id: string): void {
    const element = document.getElementById(`notification-${id}`);
    if (element) {
      element.style.animation = "slideOutRight 0.3s ease-in-out forwards";
      setTimeout(() => {
        element.remove();
        this.notifications.delete(id);
      }, 300);
    }
  }

  clear(): void {
    this.notifications.forEach((_, id) => this.remove(id));
  }

  private renderNotification(notification: Notification): void {
    if (!this.container) return;

    const element = document.createElement("div");
    element.id = `notification-${notification.id}`;
    element.className = `notification notification-${notification.type}`;

    const typeIcon = this.getTypeIcon(notification.type);
    const typeColor = this.getTypeColor(notification.type);

    element.style.cssText = `
      background: ${horrorTheme.colors.surface};
      border: 2px solid ${typeColor};
      border-radius: ${horrorTheme.borderRadius.md};
      padding: ${horrorTheme.spacing.md};
      margin-bottom: ${horrorTheme.spacing.sm};
      box-shadow: ${horrorTheme.shadows.horror};
      color: ${horrorTheme.colors.text};
      font-family: ${horrorTheme.fonts.secondary};
      pointer-events: auto;
      cursor: pointer;
      animation: slideInRight 0.3s ease-in-out;
      transition: transform ${horrorTheme.animations.fast};
    `;

    element.innerHTML = `
      <div style="display: flex; align-items: center; gap: ${horrorTheme.spacing.sm};">
        <span style="color: ${typeColor}; font-size: 1.2em;">${typeIcon}</span>
        <span style="flex: 1;">${notification.message}</span>
        <button style="
          background: none;
          border: none;
          color: ${horrorTheme.colors.textSecondary};
          cursor: pointer;
          font-size: 1.2em;
          padding: 0;
          margin-left: ${horrorTheme.spacing.sm};
        " onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
      </div>
    `;

    element.addEventListener("click", () => this.remove(notification.id));
    element.addEventListener("mouseenter", () => {
      element.style.transform = "scale(1.02)";
    });
    element.addEventListener("mouseleave", () => {
      element.style.transform = "scale(1)";
    });

    this.container.appendChild(element);
  }

  private getTypeIcon(type: NotificationType): string {
    switch (type) {
      case "info":
        return "ℹ️";
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "story":
        return "📖";
      default:
        return "ℹ️";
    }
  }

  private getTypeColor(type: NotificationType): string {
    switch (type) {
      case "info":
        return horrorTheme.colors.info;
      case "success":
        return horrorTheme.colors.success;
      case "warning":
        return horrorTheme.colors.warning;
      case "error":
        return horrorTheme.colors.danger;
      case "story":
        return horrorTheme.colors.accent;
      default:
        return horrorTheme.colors.info;
    }
  }

  private limitNotifications(): void {
    const notificationElements = this.container?.children;
    if (
      notificationElements &&
      notificationElements.length > this.maxNotifications
    ) {
      const oldest = notificationElements[0] as HTMLElement;
      const id = oldest.id.replace("notification-", "");
      this.remove(id);
    }
  }
}

// Visual Effects Manager
class VisualEffectsManager {
  private activeEffects: Map<string, VisualEffect> = new Map();

  apply(effect: VisualEffect, targetElement?: HTMLElement): string {
    const id = `effect_${Date.now()}_${Math.random()}`;
    const target = targetElement || document.body;

    this.activeEffects.set(id, effect);

    switch (effect.type) {
      case "flash":
        this.applyFlash(target, effect);
        break;
      case "shake":
        this.applyShake(target, effect);
        break;
      case "fade":
        this.applyFade(target, effect);
        break;
      case "blur":
        this.applyBlur(target, effect);
        break;
      case "distortion":
        this.applyDistortion(target, effect);
        break;
    }

    // Auto-remove after duration
    setTimeout(() => {
      this.remove(id, target);
    }, effect.duration);

    return id;
  }

  remove(id: string, targetElement?: HTMLElement): void {
    const target = targetElement || document.body;
    const effect = this.activeEffects.get(id);

    if (effect) {
      this.removeEffect(target, effect);
      this.activeEffects.delete(id);
    }
  }

  private applyFlash(target: HTMLElement, effect: VisualEffect): void {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: ${effect.color || "#FFFFFF"};
      opacity: ${effect.intensity};
      pointer-events: none;
      z-index: 9998;
      animation: flash ${effect.duration}ms ease-in-out;
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), effect.duration);
  }

  private applyShake(target: HTMLElement, effect: VisualEffect): void {
    const intensity = effect.intensity * 10;
    target.style.animation = `shake ${effect.duration}ms ease-in-out`;
    target.style.setProperty("--shake-intensity", `${intensity}px`);
  }

  private applyFade(target: HTMLElement, effect: VisualEffect): void {
    const originalOpacity = target.style.opacity || "1";
    target.style.transition = `opacity ${effect.duration}ms ease-in-out`;
    target.style.opacity = (1 - effect.intensity).toString();

    setTimeout(() => {
      target.style.opacity = originalOpacity;
    }, effect.duration);
  }

  private applyBlur(target: HTMLElement, effect: VisualEffect): void {
    const blurAmount = effect.intensity * 10;
    target.style.transition = `filter ${effect.duration}ms ease-in-out`;
    target.style.filter = `blur(${blurAmount}px)`;

    setTimeout(() => {
      target.style.filter = "none";
    }, effect.duration);
  }

  private applyDistortion(target: HTMLElement, effect: VisualEffect): void {
    const distortionAmount = effect.intensity * 5;
    target.style.transition = `transform ${effect.duration}ms ease-in-out`;
    target.style.transform = `skew(${distortionAmount}deg, ${distortionAmount}deg)`;

    setTimeout(() => {
      target.style.transform = "none";
    }, effect.duration);
  }

  private removeEffect(target: HTMLElement, effect: VisualEffect): void {
    switch (effect.type) {
      case "shake":
        target.style.animation = "";
        break;
      case "fade":
      case "blur":
      case "distortion":
        target.style.transition = "";
        target.style.opacity = "";
        target.style.filter = "";
        target.style.transform = "";
        break;
    }
  }
}

// UI Utility Functions
class UIHelpersExtended {
  static formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  static formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
  }

  static formatPercentage(value: number, max: number): string {
    return `${Math.round((value / max) * 100)}%`;
  }

  static getHealthColor(health: number, maxHealth: number): string {
    const percentage = health / maxHealth;
    if (percentage > 0.6) return horrorTheme.colors.success;
    if (percentage > 0.3) return horrorTheme.colors.warning;
    return horrorTheme.colors.danger;
  }

  static getSanityColor(sanity: number, maxSanity: number): string {
    const percentage = sanity / maxSanity;
    if (percentage > 0.7) return horrorTheme.colors.sanity;
    if (percentage > 0.4) return horrorTheme.colors.warning;
    return horrorTheme.colors.danger;
  }

  static getDifficultyColor(difficulty: Difficulty): string {
    switch (difficulty) {
      case "easy":
        return horrorTheme.colors.success;
      case "medium":
        return horrorTheme.colors.warning;
      case "hard":
        return horrorTheme.colors.danger;
      case "nightmare":
        return horrorTheme.colors.primary;
      default:
        return horrorTheme.colors.text;
    }
  }

  static createProgressBar(
    value: number,
    max: number,
    options: {
      width?: string;
      height?: string;
      backgroundColor?: string;
      fillColor?: string;
      showText?: boolean;
    } = {},
  ): HTMLElement {
    const {
      width = "200px",
      height = "20px",
      backgroundColor = horrorTheme.colors.surface,
      fillColor = horrorTheme.colors.primary,
      showText = true,
    } = options;

    const container = document.createElement("div");
    container.style.cssText = `
      width: ${width};
      height: ${height};
      background: ${backgroundColor};
      border: 2px solid ${horrorTheme.colors.textSecondary};
      border-radius: ${horrorTheme.borderRadius.sm};
      overflow: hidden;
      position: relative;
      box-shadow: ${horrorTheme.shadows.md};
    `;

    const fill = document.createElement("div");
    const percentage = Math.max(0, Math.min(100, (value / max) * 100));
    fill.style.cssText = `
      width: ${percentage}%;
      height: 100%;
      background: linear-gradient(90deg, ${fillColor}, ${fillColor}dd);
      transition: width ${horrorTheme.animations.normal};
      box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.2);
    `;

    if (showText) {
      const text = document.createElement("span");
      text.textContent = `${value}/${max}`;
      text.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: ${horrorTheme.colors.text};
        font-family: ${horrorTheme.fonts.secondary};
        font-size: 12px;
        font-weight: bold;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        z-index: 1;
      `;
      container.appendChild(text);
    }

    container.appendChild(fill);
    return container;
  }

  static createButton(
    text: string,
    options: {
      variant?: "primary" | "secondary" | "danger" | "ghost";
      size?: "sm" | "md" | "lg";
      disabled?: boolean;
      onClick?: () => void;
    } = {},
  ): HTMLButtonElement {
    const {
      variant = "primary",
      size = "md",
      disabled = false,
      onClick,
    } = options;

    const button = document.createElement("button");
    button.textContent = text;
    button.disabled = disabled;

    const variants = {
      primary: {
        background: horrorTheme.colors.primary,
        color: horrorTheme.colors.text,
        border: `2px solid ${horrorTheme.colors.primary}`,
      },
      secondary: {
        background: horrorTheme.colors.surface,
        color: horrorTheme.colors.text,
        border: `2px solid ${horrorTheme.colors.textSecondary}`,
      },
      danger: {
        background: horrorTheme.colors.danger,
        color: horrorTheme.colors.text,
        border: `2px solid ${horrorTheme.colors.danger}`,
      },
      ghost: {
        background: "transparent",
        color: horrorTheme.colors.text,
        border: `2px solid ${horrorTheme.colors.textSecondary}`,
      },
    };

    const sizes = {
      sm: {
        padding: `${horrorTheme.spacing.xs} ${horrorTheme.spacing.sm}`,
        fontSize: "0.875rem",
      },
      md: {
        padding: `${horrorTheme.spacing.sm} ${horrorTheme.spacing.md}`,
        fontSize: "1rem",
      },
      lg: {
        padding: `${horrorTheme.spacing.md} ${horrorTheme.spacing.lg}`,
        fontSize: "1.125rem",
      },
    };

    const variantStyle = variants[variant];
    const sizeStyle = sizes[size];

    button.style.cssText = `
      background: ${variantStyle.background};
      color: ${variantStyle.color};
      border: ${variantStyle.border};
      border-radius: ${horrorTheme.borderRadius.md};
      padding: ${sizeStyle.padding};
      font-size: ${sizeStyle.fontSize};
      font-family: ${horrorTheme.fonts.secondary};
      cursor: ${disabled ? "not-allowed" : "pointer"};
      transition: all ${horrorTheme.animations.fast};
      box-shadow: ${horrorTheme.shadows.md};
      opacity: ${disabled ? "0.5" : "1"};
    `;

    if (!disabled) {
      button.addEventListener("mouseenter", () => {
        button.style.transform = "translateY(-2px)";
        button.style.boxShadow = horrorTheme.shadows.lg;
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "translateY(0)";
        button.style.boxShadow = horrorTheme.shadows.md;
      });

      button.addEventListener("mousedown", () => {
        button.style.transform = "translateY(1px)";
      });

      button.addEventListener("mouseup", () => {
        button.style.transform = "translateY(-2px)";
      });
    }

    if (onClick) {
      button.addEventListener("click", onClick);
    }

    return button;
  }

  static createModal(
    content: string | HTMLElement,
    options: {
      title?: string;
      closable?: boolean;
      onClose?: () => void;
    } = {},
  ): HTMLElement {
    const { title, closable = true, onClose } = options;

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-in-out;
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
      background: ${horrorTheme.colors.background};
      border: 2px solid ${horrorTheme.colors.primary};
      border-radius: ${horrorTheme.borderRadius.lg};
      box-shadow: ${horrorTheme.shadows.horror};
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      animation: slideInUp 0.3s ease-in-out;
    `;

    if (title) {
      const header = document.createElement("div");
      header.style.cssText = `
        padding: ${horrorTheme.spacing.lg};
        border-bottom: 1px solid ${horrorTheme.colors.textSecondary};
        display: flex;
        align-items: center;
        justify-content: space-between;
      `;

      const titleElement = document.createElement("h2");
      titleElement.textContent = title;
      titleElement.style.cssText = `
        margin: 0;
        color: ${horrorTheme.colors.text};
        font-family: ${horrorTheme.fonts.primary};
      `;

      header.appendChild(titleElement);

      if (closable) {
        const closeButton = document.createElement("button");
        closeButton.innerHTML = "&times;";
        closeButton.style.cssText = `
          background: none;
          border: none;
          color: ${horrorTheme.colors.textSecondary};
          font-size: 2rem;
          cursor: pointer;
          padding: 0;
          margin-left: ${horrorTheme.spacing.md};
        `;

        closeButton.addEventListener("click", () => {
          overlay.remove();
          if (onClose) onClose();
        });

        header.appendChild(closeButton);
      }

      modal.appendChild(header);
    }

    const body = document.createElement("div");
    body.style.cssText = `
      padding: ${horrorTheme.spacing.lg};
      color: ${horrorTheme.colors.text};
      font-family: ${horrorTheme.fonts.secondary};
    `;

    if (typeof content === "string") {
      body.innerHTML = content;
    } else {
      body.appendChild(content);
    }

    modal.appendChild(body);
    overlay.appendChild(modal);

    if (closable) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.remove();
          if (onClose) onClose();
        }
      });
    }

    document.body.appendChild(overlay);
    return overlay;
  }

  static addGlobalStyles(): void {
    if (typeof window === "undefined") return;

    const styleId = "haunted-asylum-ui-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      
      @keyframes flash {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(var(--shake-intensity, 5px)); }
        75% { transform: translateX(calc(-1 * var(--shake-intensity, 5px))); }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideInUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 5px ${horrorTheme.colors.glow}; }
        50% { box-shadow: 0 0 20px ${horrorTheme.colors.glow}, 0 0 30px ${horrorTheme.colors.glow}; }
      }
      
      .horror-glow {
        animation: glow 2s ease-in-out infinite;
      }
      
      .horror-pulse {
        animation: pulse 1.5s ease-in-out infinite;
      }
      
      .horror-text {
        font-family: ${horrorTheme.fonts.primary};
        color: ${horrorTheme.colors.text};
        text-shadow: 2px 2px 4px ${horrorTheme.colors.shadow};
      }
      
      .horror-button:hover {
        animation: glow 0.5s ease-in-out;
      }
      
      .horror-card {
        background: ${horrorTheme.colors.surface};
        border: 2px solid ${horrorTheme.colors.textSecondary};
        border-radius: ${horrorTheme.borderRadius.md};
        box-shadow: ${horrorTheme.shadows.horror};
        padding: ${horrorTheme.spacing.md};
        color: ${horrorTheme.colors.text};
        font-family: ${horrorTheme.fonts.secondary};
      }
    `;

    document.head.appendChild(style);
  }
}

// Create singleton instances
export const notificationManager = new NotificationManager();
export const visualEffectsManager = new VisualEffectsManager();
export const uiHelpers = new UIHelpersExtended();

// Convenience functions
export const showNotification = (
  message: string,
  type: NotificationType = "info",
  duration?: number,
) => {
  return notificationManager.show({ message, type, duration });
};

export const showSuccess = (message: string, duration?: number) =>
  showNotification(message, "success", duration);

export const showError = (message: string, duration?: number) =>
  showNotification(message, "error", duration);

export const showWarning = (message: string, duration?: number) =>
  showNotification(message, "warning", duration);

export const showInfo = (message: string, duration?: number) =>
  showNotification(message, "info", duration);

export const showStory = (message: string, duration?: number) =>
  showNotification(message, "story", duration);

export const applyVisualEffect = (
  type: EffectType,
  intensity: number = 0.5,
  duration: number = 1000,
  color?: string,
) => {
  return visualEffectsManager.apply({
    id: "",
    type,
    intensity,
    duration,
    color,
  });
};

// Horror-specific effects
export const jumpScare = () => {
  applyVisualEffect("flash", 1, 200, "#FF0000");
  setTimeout(() => applyVisualEffect("shake", 0.8, 500), 100);
};

export const sanityLoss = () => {
  applyVisualEffect("distortion", 0.6, 1000);
  applyVisualEffect("blur", 0.4, 800);
};

// ... existing code ...

export const healthCritical = () => {
  applyVisualEffect("flash", 0.3, 300, "#FF0000");
};

// Initialize global styles when in browser
if (typeof window !== "undefined") {
  UIHelpersExtended.addGlobalStyles();
}

export class UIHelpers {
  static createDialogueBox(dialogue: Dialogue): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    max-width: 600px;
    background: ${horrorTheme.colors.surface};
    border: 2px solid ${horrorTheme.colors.primary};
    border-radius: ${horrorTheme.borderRadius.md};
    padding: ${horrorTheme.spacing.lg};
    box-shadow: ${horrorTheme.shadows.horror};
    z-index: 1000;
  `;

    const speaker = document.createElement("div");
    speaker.textContent = dialogue.speaker;
    speaker.style.cssText = `
    color: ${horrorTheme.colors.accent};
    font-family: ${horrorTheme.fonts.primary};
    font-size: 18px;
    margin-bottom: ${horrorTheme.spacing.sm};
    text-shadow: ${horrorTheme.shadows.glow};
  `;

    const text = document.createElement("div");
    text.textContent = dialogue.text;
    text.style.cssText = `
    color: ${horrorTheme.colors.text};
    font-family: ${horrorTheme.fonts.secondary};
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: ${horrorTheme.spacing.md};
  `;

    container.appendChild(speaker);
    container.appendChild(text);

    if (dialogue.options && dialogue.options.length > 0) {
      const optionsContainer = document.createElement("div");
      optionsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: ${horrorTheme.spacing.sm};
    `;

      dialogue.options.forEach((option: DialogueOption) => {
        const button = UIHelpersExtended.createButton(option.text, {
          variant: !("disabled" in option) ? "primary" : "ghost",
          disabled: false,
          onClick: () => {
            if (option.action) option.action();
          },
        });
        optionsContainer.appendChild(button);
      });

      container.appendChild(optionsContainer);
    }

    return container;
  }

  // Player Status Display
  static createPlayerStatusPanel(player: Player): HTMLElement {
    const panel = document.createElement("div");
    panel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${horrorTheme.colors.surface};
    border: 2px solid ${horrorTheme.colors.textSecondary};
    border-radius: ${horrorTheme.borderRadius.md};
    padding: ${horrorTheme.spacing.md};
    box-shadow: ${horrorTheme.shadows.md};
    z-index: 999;
  `;

    const name = document.createElement("div");
    name.textContent = player.name;
    name.style.cssText = `
    color: ${horrorTheme.colors.accent};
    font-family: ${horrorTheme.fonts.primary};
    font-size: 18px;
    margin-bottom: ${horrorTheme.spacing.sm};
    text-align: center;
  `;

    const healthBar = UIHelpersExtended.createProgressBar(
      player.health,
      player.maxHealth,
      {
        fillColor: UIHelpersExtended.getHealthColor(
          player.health,
          player.maxHealth,
        ),
        width: "150px",
        height: "16px",
      },
    );

    const sanityBar = UIHelpersExtended.createProgressBar(
      player.sanity,
      player.maxSanity,
      {
        fillColor: UIHelpersExtended.getSanityColor(
          player.sanity,
          player.maxSanity,
        ),
        width: "150px",
        height: "16px",
      },
    );

    const healthLabel = document.createElement("div");
    healthLabel.textContent = "Health";
    healthLabel.style.cssText = `
    color: ${horrorTheme.colors.text};
    font-size: 12px;
    margin-bottom: 4px;
  `;

    const sanityLabel = document.createElement("div");
    sanityLabel.textContent = "Sanity";
    sanityLabel.style.cssText = `
    color: ${horrorTheme.colors.text};
    font-size: 12px;
    margin: ${horrorTheme.spacing.sm} 0 4px 0;
  `;

    panel.appendChild(name);
    panel.appendChild(healthLabel);
    panel.appendChild(healthBar);
    panel.appendChild(sanityLabel);
    panel.appendChild(sanityBar);

    return panel;
  }

  // Inventory Display
  static createInventoryGrid(items: InventoryItem[]): HTMLElement {
    const grid = document.createElement("div");
    grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: ${horrorTheme.spacing.sm};
    padding: ${horrorTheme.spacing.md};
    background: ${horrorTheme.colors.surface};
    border: 2px solid ${horrorTheme.colors.textSecondary};
    border-radius: ${horrorTheme.borderRadius.md};
    max-height: 300px;
    overflow-y: auto;
  `;

    items.forEach((item, index) => {
      const slot = document.createElement("div");
      slot.style.cssText = `
      width: 80px;
      height: 80px;
      background: ${horrorTheme.colors.background};
      border: 2px solid ${horrorTheme.colors.textSecondary};
      border-radius: ${horrorTheme.borderRadius.sm};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all ${horrorTheme.animations.fast};
      position: relative;
    `;

      slot.addEventListener("mouseenter", () => {
        slot.style.borderColor = horrorTheme.colors.accent;
        slot.style.boxShadow = horrorTheme.shadows.glow;
      });

      slot.addEventListener("mouseleave", () => {
        slot.style.borderColor = horrorTheme.colors.textSecondary;
        slot.style.boxShadow = "none";
      });

      // Add click handler that uses the index
      slot.addEventListener("click", () => {
        console.log(`Clicked item at index ${index}:`, item);
        // Add your item interaction logic here
      });

      const icon = document.createElement("div");
      icon.textContent = "📦";
      icon.style.fontSize = "24px";

      const name = document.createElement("div");
      name.textContent = item.name;
      name.style.cssText = `
      color: ${horrorTheme.colors.text};
      font-size: 10px;
      text-align: center;
      margin-top: 4px;
    `;

      if (item.quantity && item.quantity > 1) {
        const quantity = document.createElement("div");
        quantity.textContent = item.quantity.toString();
        quantity.style.cssText = `
        position: absolute;
        top: 2px;
        right: 2px;
        background: ${horrorTheme.colors.accent};
        color: ${horrorTheme.colors.text};
        border-radius: ${horrorTheme.borderRadius.full};
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
      `;
        slot.appendChild(quantity);
      }

      slot.appendChild(icon);
      slot.appendChild(name);
      grid.appendChild(slot);
    });

    return grid;
  }

  // Room Information Display
  static createRoomInfo(room: Room): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: ${horrorTheme.colors.surface};
    border: 2px solid ${horrorTheme.colors.textSecondary};
    border-radius: ${horrorTheme.borderRadius.md};
    padding: ${horrorTheme.spacing.md};
    box-shadow: ${horrorTheme.shadows.md};
    z-index: 999;
    max-width: 300px;
  `;

    const name = document.createElement("div");
    name.textContent = room.name;
    name.style.cssText = `
    color: ${horrorTheme.colors.accent};
    font-family: ${horrorTheme.fonts.primary};
    font-size: 18px;
    margin-bottom: ${horrorTheme.spacing.sm};
  `;

    const description = document.createElement("div");
    description.textContent = room.description;
    description.style.cssText = `
    color: ${horrorTheme.colors.text};
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: ${horrorTheme.spacing.sm};
  `;

    container.appendChild(name);
    container.appendChild(description);

    if (room.items && room.items.length > 0) {
      const itemsLabel = document.createElement("div");
      itemsLabel.textContent = "Items:";
      itemsLabel.style.cssText = `
      color: ${horrorTheme.colors.textSecondary};
      font-size: 12px;
      margin-bottom: 4px;
    `;

      const itemsList = document.createElement("div");
      itemsList.textContent = room.items.map((item) => item.name).join(", ");
      itemsList.style.cssText = `
      color: ${horrorTheme.colors.text};
      font-size: 12px;
    `;

      container.appendChild(itemsLabel);
      container.appendChild(itemsList);
    }

    return container;
  }

  // Game State Display
  static createGameStateIndicator(gameState: GameState): HTMLElement {
    const indicator = document.createElement("div");
    indicator.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${horrorTheme.colors.surface};
    border: 3px solid ${horrorTheme.colors.primary};
    border-radius: ${horrorTheme.borderRadius.lg};
    padding: ${horrorTheme.spacing.xl};
    box-shadow: ${horrorTheme.shadows.horror};
    z-index: 1001;
    text-align: center;
  `;

    const stateText = document.createElement("div");
    stateText.textContent =
      gameState.charAt(0).toUpperCase() + gameState.slice(1);
    stateText.style.cssText = `
    color: ${horrorTheme.colors.accent};
    font-family: ${horrorTheme.fonts.primary};
    font-size: 32px;
    text-shadow: ${horrorTheme.shadows.glow};
  `;

    indicator.appendChild(stateText);
    return indicator;
  }

  // Settings Panel
  static createSettingsPanel(
    settings: GameSettings,
    onUpdate: (settings: GameSettings) => void,
  ): HTMLElement {
    const panel = document.createElement("div");
    panel.style.cssText = `
    background: ${horrorTheme.colors.surface};
    border: 2px solid ${horrorTheme.colors.textSecondary};
    border-radius: ${horrorTheme.borderRadius.md};
    padding: ${horrorTheme.spacing.lg};
    box-shadow: ${horrorTheme.shadows.md};
    width: 400px;
  `;

    const title = document.createElement("h3");
    title.textContent = "Game Settings";
    title.style.cssText = `
    color: ${horrorTheme.colors.accent};
    font-family: ${horrorTheme.fonts.primary};
    margin-bottom: ${horrorTheme.spacing.md};
    text-align: center;
  `;

    // Sound Volume
    const soundLabel = document.createElement("label");
    soundLabel.textContent = `Sound Volume: ${Math.round(settings.soundVolume * 100)}%`;
    soundLabel.style.cssText = `
    color: ${horrorTheme.colors.text};
    display: block;
    margin-bottom: ${horrorTheme.spacing.sm};
  `;

    const soundSlider = document.createElement("input");
    soundSlider.type = "range";
    soundSlider.min = "0";
    soundSlider.max = "1";
    soundSlider.step = "0.1";
    soundSlider.value = settings.soundVolume.toString();
    soundSlider.style.cssText = `
    width: 100%;
    margin-bottom: ${horrorTheme.spacing.md};
  `;

    soundSlider.addEventListener("input", () => {
      const newSettings = {
        ...settings,
        soundVolume: parseFloat(soundSlider.value),
      };
      soundLabel.textContent = `Sound Volume: ${Math.round(newSettings.soundVolume * 100)}%`;
      onUpdate(newSettings);
    });

    // Music Volume
    const musicLabel = document.createElement("label");
    musicLabel.textContent = `Music Volume: ${Math.round(settings.musicVolume * 100)}%`;
    musicLabel.style.cssText = `
    color: ${horrorTheme.colors.text};
    display: block;
    margin-bottom: ${horrorTheme.spacing.sm};
  `;

    const musicSlider = document.createElement("input");
    musicSlider.type = "range";
    musicSlider.min = "0";
    musicSlider.max = "1";
    musicSlider.step = "0.1";
    musicSlider.value = settings.musicVolume.toString();
    musicSlider.style.cssText = `
    width: 100%;
    margin-bottom: ${horrorTheme.spacing.md};
  `;

    musicSlider.addEventListener("input", () => {
      const newSettings = {
        ...settings,
        musicVolume: parseFloat(musicSlider.value),
      };
      musicLabel.textContent = `Music Volume: ${Math.round(newSettings.musicVolume * 100)}%`;
      onUpdate(newSettings);
    });

    // Difficulty
    const difficultyLabel = document.createElement("label");
    difficultyLabel.textContent = "Difficulty:";
    difficultyLabel.style.cssText = `
    color: ${horrorTheme.colors.text};
    display: block;
    margin-bottom: ${horrorTheme.spacing.sm};
  `;

    const difficultySelect = document.createElement("select");
    difficultySelect.style.cssText = `
    width: 100%;
    padding: ${horrorTheme.spacing.sm};
    background: ${horrorTheme.colors.background};
    color: ${horrorTheme.colors.text};
    border: 2px solid ${horrorTheme.colors.textSecondary};
    border-radius: ${horrorTheme.borderRadius.sm};
  `;

    ["easy", "medium", "hard", "nightmare"].forEach((diff, index) => {
      const option = document.createElement("option");
      option.value = diff;
      option.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
      option.selected = settings.difficulty === diff;
      // You can now use the index if needed, for example:
      option.setAttribute("data-index", index.toString());
      difficultySelect.appendChild(option);
    });

    difficultySelect.addEventListener("change", () => {
      const newSettings = {
        ...settings,
        difficulty: difficultySelect.value as Difficulty,
      };
      onUpdate(newSettings);
    });

    panel.appendChild(title);
    panel.appendChild(soundLabel);
    panel.appendChild(soundSlider);
    panel.appendChild(musicLabel);
    panel.appendChild(musicSlider);
    panel.appendChild(difficultyLabel);
    panel.appendChild(difficultySelect);

    return panel;
  }
}
