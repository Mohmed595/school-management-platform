export interface SystemExtension {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  icon: string;
  category: string;
  defaultEnabled: boolean;
  isSystemLocked: boolean;
  defaultSettings: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolExtension {
  id: string;
  schoolId: string;
  extensionId: string;
  isEnabled: boolean;
  settings: Record<string, any>;
  activatedAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  // Merged metadata for UI display
  name?: string;
  nameEn?: string;
  description?: string;
  icon?: string;
  category?: string;
  isSystemLocked?: boolean;
}

export interface FeatureLockStatus {
  enabled: boolean;
  lockReason?: string;
  extensionActive: boolean;
  extensionId?: string;
}

export interface SchoolFeaturesResponse {
  success: boolean;
  features: Record<string, FeatureLockStatus>;
}

export interface StudentFeaturesSettings {
  community_enabled: boolean;
  [key: string]: any;
}
