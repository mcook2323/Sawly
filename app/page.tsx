import Link from "next/link";

const projects = [
  {
    title: "Modern Outdoor Table",
    description: "A welcoming outdoor dining table, sized precisely for your space.",
    cost: "$180–$250",
    time: "6 hours",
    difficulty: "Beginner",
    available: true,
    href: "/projects/outdoor-table",
    tone: "bg-[#d8b08c]",
    kind: "table",
  },
  {
    title: "Outdoor Bench",
    description: "A simple modern bench for patios, porches, and garden spaces.",
    cost: "$80–$140",
    time: "3 hours",
    difficulty: "Beginner",
    available: false,
    href: "#",
    tone: "bg-[#b9c4ad]",
    kind: "bench",
  },
  {
    title: "Raised Garden Bed",
    description: "A clean raised bed for vegetables, flowers, or backyard landscaping.",
    cost: "$60–$120",
    time: "2 hours",
    difficulty: "Beginner",
    available: false,
    href: "#",
    tone: "bg-[#c9a99a]",
    kind: "garden",
  },
  {
    title: "Garage Workbench",
    description: "A sturdy customizable workbench for tools, storage, and projects.",
    cost: "$150–$300",
    time: "5 hours",
    difficulty: "Intermediate",
    available: false,
    href: "#",
    tone: "bg-[#c8b99e]",
    kind: "workbench",
  },
];

function ProjectIllustration({
  tone,
  kind,
}: {
  tone: string;
  kind: string;
}) {
  return (
    <div className={`relative h-56 overflow-hidden ${tone}`} aria-hidden="true">
      <div className="absolute inset-x-0 bottom-0 h-16 bg-[#eadfce]/70" />
      {kind === "garden" ? (
        <>
          <div className="absolute left-[19%] top-[43%] h-20 w-[62%] -skew-x-[7deg] border border-[#72513d]/20 bg-[#a96f48] shadow-xl" />
          <div className="absolute left-[23%] top-[35%] h-16 w-12 rounded-t-full bg-[#788765]" />
          <div className="absolute left-[45%] top-[29%] h-20 w-12 rounded-t-full bg-[#879676]" />
          <div className="absolute right-[22%] top-[36%] h-16 w-10 rounded-t-full bg-[#6f8060]" />
        </>
      ) : kind === "bench" ? (
        <>
          <div className="absolute left-[15%] top-[42%] h-10 w-[70%] -skew-x-[12deg] bg-[#a96f48] shadow-xl" />
          <div className="absolute left-[23%] top-[51%] h-20 w-3 bg-[#79533b]" />
          <div className="absolute right-[23%] top-[51%] h-20 w-3 bg-[#79533b]" />
        </>
      ) : (
        <>
          <div className="absolute left-[17%] top-[22%] h-24 w-[66%] -skew-x-[18deg] rounded-sm border border-[#72513d]/20 bg-[#a96f48] shadow-xl" />
          <div className="absolute left-[24%] top-[52%] h-20 w-3 bg-[#79533b]" />
          <div className="absolute right-[24%] top-[52%] h-20 w-3 bg-[#79533b]" />
          {kind === "workbench" && (
            <div className="absolute left-[25%] top-[71%] h-3 w-1/2 bg-[#8c6247]" />
          )}
        </>
      )}
      <div className="absolute right-7 top-5 h-16 w-16 rounded-full bg-[#f7e4b0]/60" />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f3eb] text-[#332b25]">
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-20">
        <div className="mb-12 max-w-3xl sm:mb-16">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-[#6f7b5b]">
            Sawly
          </p>
          <h1 className="editorial-title text-5xl leading-[0.98] tracking-[-0.04em] text-[#332b25] sm:text-7xl">
            Make something worth keeping.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#71675f]">
            Choose a project, make it fit your home, and get a practical plan
            with every cut, material, and tool clearly organized.
          </p>
        </div>

        <div className="mb-10 rounded-2xl border border-[#ded4c6] bg-white p-2 shadow-[0_10px_35px_rgba(85,67,48,0.08)]">
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <input
            id="project-search"
            type="text"
            placeholder="What would you like to build?"
            className="w-full rounded-xl bg-[#fbf9f5] px-5 py-4 text-[#332b25] placeholder:text-[#9a8e83] outline-none transition-shadow focus:ring-2 focus:ring-[#71805f]/30"
          />
        </div>

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a05f47]">
              Project collection
            </p>
            <h2 className="editorial-title mt-2 text-3xl text-[#332b25]">
              Designed for real homes
            </h2>
          </div>
          <span className="hidden text-sm text-[#8a7e73] sm:block">4 projects</span>
        </div>

        <div className="grid gap-7 md:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.title}
              className="group overflow-hidden rounded-[1.5rem] border border-[#ded4c6] bg-white shadow-[0_12px_40px_rgba(85,67,48,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(85,67,48,0.13)]"
            >
              <ProjectIllustration tone={project.tone} kind={project.kind} />

              <div className="p-6 sm:p-7">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <h3 className="editorial-title text-2xl leading-tight text-[#332b25]">
                    {project.title}
                  </h3>
                  {!project.available && (
                    <span className="shrink-0 rounded-full bg-[#f0ebe3] px-3 py-1 text-xs font-medium text-[#81756a]">
                      Coming soon
                    </span>
                  )}
                </div>

                <p className="mb-6 leading-7 text-[#71675f]">{project.description}</p>

                <dl className="mb-7 grid grid-cols-3 divide-x divide-[#e7ded2] border-y border-[#e7ded2] py-4 text-sm">
                  {[
                    ["Cost", project.cost],
                    ["Time", project.time],
                    ["Skill", project.difficulty],
                  ].map(([label, value]) => (
                    <div key={label} className="px-3 first:pl-0 last:pr-0">
                      <dt className="text-xs text-[#9a8e83]">{label}</dt>
                      <dd className="mt-1 font-semibold text-[#4a4038]">{value}</dd>
                    </div>
                  ))}
                </dl>

                {project.available ? (
                  <Link
                    href={project.href}
                    className="inline-flex rounded-full bg-[#667154] px-5 py-3 font-semibold text-white transition-all hover:bg-[#566146] hover:shadow-lg"
                  >
                    Customize this project
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex cursor-not-allowed rounded-full bg-[#eee8df] px-5 py-3 font-semibold text-[#a0958b]"
                  >
                    Not available yet
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
