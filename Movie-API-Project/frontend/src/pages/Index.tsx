const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="max-w-2xl text-center animate-fade-in">
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          Welcome to FlicksLounge
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Dive into a world of movies, series, and stories that move you.
          Start building your cinematic experience now.
        </p>
        <div className="flex justify-center gap-4">
          <button className="btn-primary">Explore Now</button>
          <button className="btn-secondary">Learn More</button>
        </div>
      </div>
    </div>
  );
};

export default Index;