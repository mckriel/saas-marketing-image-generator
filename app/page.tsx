export default function Home() {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl font-bold mb-4">SaaS Image Generator</h1>
        <p className="text-lg text-gray-600 mb-6">Upload your product. Get instant marketing visuals.</p>
        <a href="/upload" className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">Get Started</a>
      </main>
    )
}
