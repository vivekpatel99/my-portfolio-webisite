import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shellCopy } from '@/data/shellCopy';
import { localizedPath, useLocale } from '@/lib/locale';
import { Seo } from '@/lib/seo';

const NotFound = () => {
  const locale = useLocale();
  const copy = shellCopy[locale];
  return (
    <section className="min-h-[70vh] bg-[#0C0D0D] text-white pt-36 pb-24">
      <Seo
        title={`${copy.notFound} | Vivek Patel`}
        description={copy.notFoundMeta}
        path="/404"
        noindex
      />
      <div className="container mx-auto px-6 max-w-3xl">
        <p className="text-accent-purple-text font-semibold uppercase tracking-wide mb-4">404</p>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">{copy.notFound}</h1>
        <p className="text-lg text-gray-300 mb-8">
          {copy.notFoundDescription}
        </p>
        <Button asChild className="bg-accent-purple text-white hover:bg-accent-purple/90 rounded-full">
          <Link to={localizedPath('/', locale)}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            {copy.backHome}
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default NotFound;
