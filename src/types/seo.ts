export type Breadcrumb = {
  name: string;
  url: string;
};

export type SeoProps = {
  title?: string;
  description?: string;
  url?: string;
  noIndex?: boolean;
  breadcrumbs?: Breadcrumb[];
};
