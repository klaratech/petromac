export { default as SuccessStoriesPage } from './containers/SuccessStoriesPage';
export { default as SuccessStoriesWidget } from './containers/SuccessStoriesWidget';
export * from './types/successStories.types';
export * from './services/successStories.service';
// Note: hooks are not exported from module index as they can only be used in client components
// Import directly from './hooks/useSuccessStoriesFilters' if needed
