interface CardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CardPage({ params }: CardPageProps) {
  const { slug } = await params;

  return (
    <div className="flex items-center justify-center min-h-screen pt-16">
      <h1 className="font-[var(--font-display)] text-4xl font-bold tracking-tight">
        Card: {slug}
      </h1>
    </div>
  );
}
