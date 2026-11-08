import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-page px-4 py-20 md:px-6">
      <h1 className="m-0 font-heading text-4xl font-bold">Page not found</h1>
      <p className="mt-4 text-muted">This address does not match a page on the site.</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-royal">
        Go to the home page
      </Link>
    </div>
  );
}
