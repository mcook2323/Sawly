import Link from "next/link";

const projects = [
  {
    title: "Modern Outdoor Table",
    description: "A beginner-friendly outdoor dining table customized to your space.",
    cost: "$180–$250",
    time: "6 hours",
    difficulty: "Beginner",
    available: true,
    href: "/projects/outdoor-table",
  },
  {
    title: "Outdoor Bench",
    description: "A simple modern bench for patios, porches, and garden spaces.",
    cost: "$80–$140",
    time: "3 hours",
    difficulty: "Beginner",
    available: false,
    href: "#",
  },
  {
    title: "Raised Garden Bed",
    description: "A clean raised bed for vegetables, flowers, or backyard landscaping.",
    cost: "$60–$120",
    time: "2 hours",
    difficulty: "Beginner",
    available: false,
    href: "#",
  },
  {
    title: "Garage Workbench",
    description: "A sturdy customizable workbench for tools, storage, and projects.",
    cost: "$150–$300",
    time: "5 hours",
    difficulty: "Intermediate",
    available: false,
    href: "#",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-400">
            Sawly
          </p>

          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            Build it yourself.
          </h1>

          <p className="text-lg text-neutral-300">
            Choose a project, customize the dimensions, and generate a buildable
            plan with a cut list, materials, hardware, and cost estimate.
          </p>
        </div>

        <div className="mb-10">
          <input
            type="text"
            placeholder="Search for a project, like outdoor table, bench, shelf..."
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-4 text-white placeholder:text-neutral-500 outline-none focus:border-amber-400"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.title}
              className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900"
            >
              <div className="flex h-56 items-center justify-center bg-neutral-800 text-neutral-500">
                Project Image / Blueprint Preview
              </div>

              <div className="p-6">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">{project.title}</h2>

                  {!project.available && (
                    <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-400">
                      Coming soon
                    </span>
                  )}
                </div>

                <p className="mb-5 text-neutral-300">{project.description}</p>

                <div className="mb-6 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-neutral-800 p-3">
                    <div className="text-neutral-500">Cost</div>
                    <div>{project.cost}</div>
                  </div>

                  <div className="rounded-lg bg-neutral-800 p-3">
                    <div className="text-neutral-500">Time</div>
                    <div>{project.time}</div>
                  </div>

                  <div className="rounded-lg bg-neutral-800 p-3">
                    <div className="text-neutral-500">Skill</div>
                    <div>{project.difficulty}</div>
                  </div>
                </div>

                {project.available ? (
                  <Link
                    href={project.href}
                    className="inline-flex rounded-xl bg-amber-400 px-5 py-3 font-semibold text-neutral-950 hover:bg-amber-300"
                  >
                    Customize
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex cursor-not-allowed rounded-xl bg-neutral-800 px-5 py-3 font-semibold text-neutral-500"
                  >
                    Not available yet
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}