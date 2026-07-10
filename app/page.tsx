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

const categories = ["Outdoor", "Indoor", "Garage", "Garden", "Storage"];

function ProjectIllustration({
  tone,
  kind,
  featured = false,
}: {
  tone: string;
  kind: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden ${tone} ${featured ? "h-[26rem] sm:h-[34rem]" : "h-64 sm:h-72"}`}
      aria-hidden="true"
    >
      <div className="absolute inset-x-0 bottom-0 h-[27%] bg-[#eadfce]/75" />
      <div className="absolute right-[10%] top-[8%] h-20 w-20 rounded-full bg-[#f7e4b0]/65 sm:h-28 sm:w-28" />
      <div className="absolute left-[8%] top-[12%] h-24 w-16 rounded-t-full bg-[#71805f]/45" />
      {kind === "garden" ? (
        <>
          <div className="absolute left-[19%] top-[43%] h-24 w-[62%] -skew-x-[7deg] border border-[#72513d]/20 bg-[#a96f48] shadow-xl" />
          <div className="absolute left-[23%] top-[32%] h-20 w-12 rounded-t-full bg-[#788765]" />
          <div className="absolute left-[45%] top-[27%] h-24 w-12 rounded-t-full bg-[#879676]" />
          <div className="absolute right-[22%] top-[34%] h-20 w-10 rounded-t-full bg-[#6f8060]" />
        </>
      ) : kind === "bench" ? (
        <>
          <div className="absolute left-[15%] top-[43%] h-11 w-[70%] -skew-x-[12deg] bg-[#a96f48] shadow-xl" />
          <div className="absolute left-[23%] top-[52%] h-24 w-3 bg-[#79533b]" />
          <div className="absolute right-[23%] top-[52%] h-24 w-3 bg-[#79533b]" />
        </>
      ) : (
        <>
          <div className="absolute left-[15%] top-[24%] h-[28%] w-[70%] -skew-x-[18deg] rounded-sm border border-[#72513d]/20 bg-[#a96f48] shadow-2xl" />
          <div className="absolute left-[23%] top-[51%] h-[30%] w-3 bg-[#79533b]" />
          <div className="absolute right-[23%] top-[51%] h-[30%] w-3 bg-[#79533b]" />
          {kind === "workbench" && (
            <div className="absolute left-[24%] top-[70%] h-3 w-[52%] bg-[#8c6247]" />
          )}
        </>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f5ef] text-[#332b25]">
      <header className="border-b border-[#e6ddd1] bg-[#fcfaf6]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="editorial-title text-2xl text-[#332b25]">
            Sawly
          </Link>
          <nav className="flex items-center gap-5 text-sm" aria-label="Primary navigation">
            <a
              href="#project-collection"
              className="hidden font-medium text-[#71675f] transition-colors hover:text-[#4f5d41] sm:inline"
            >
              Projects
            </a>
            <Link
              href="/projects/outdoor-table"
              className="rounded-full bg-[#667154] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#566146]"
            >
              Start building
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(28rem,1.05fr)] lg:items-center lg:gap-16 lg:px-8">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#a05f47]">
            Custom plans for real homes
          </p>
          <h1 className="editorial-title max-w-3xl text-5xl leading-[0.96] tracking-[-0.045em] text-[#332b25] sm:text-7xl lg:text-[5.35rem]">
            Build with confidence. Make it yours.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#71675f]">
            Customize proven DIY projects to fit your home, then take a clear
            materials list, cut plan, and step-by-step guide into the shop.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/projects/outdoor-table"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#667154] px-6 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(78,91,62,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#566146]"
            >
              Customize the outdoor table
            </Link>
            <a
              href="#project-collection"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d5c9ba] bg-[#fffdf9] px-6 py-3 font-semibold text-[#554a41] transition-colors hover:border-[#b9aa97] hover:bg-white"
            >
              Browse projects
            </a>
          </div>

          <div className="mt-9 max-w-xl rounded-2xl border border-[#ded4c6] bg-white p-2 shadow-[0_12px_40px_rgba(85,67,48,0.08)]">
            <div className="flex items-center gap-3 rounded-xl bg-[#f7f2ea] px-4 py-3.5">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0 fill-none stroke-[#8b7f74] stroke-2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <label htmlFor="project-search" className="sr-only">
                Search projects
              </label>
              <input
                id="project-search"
                type="text"
                disabled
                placeholder="Search projects"
                className="min-w-0 flex-1 bg-transparent text-[#74695f] placeholder:text-[#9a8e83] disabled:cursor-not-allowed"
              />
              <span className="shrink-0 rounded-full bg-[#e9e2d7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#81756a]">
                Coming soon
              </span>
            </div>
          </div>
        </div>

        <div className="relative lg:pl-4">
          <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-[#d8b08c] shadow-[0_30px_80px_rgba(85,67,48,0.2)]">
            <ProjectIllustration tone="bg-[#d8b08c]" kind="table" featured />
          </div>
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/70 bg-[#fffdf9]/90 p-4 shadow-xl backdrop-blur sm:bottom-7 sm:left-7 sm:right-auto sm:w-72">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a05f47]">
              Featured project
            </p>
            <p className="editorial-title mt-1 text-2xl">Modern Outdoor Table</p>
            <p className="mt-1 text-sm text-[#786c62]">Sized to your space in seconds.</p>
          </div>
        </div>
      </section>

      <section
        id="project-collection"
        className="border-t border-[#e6ddd1] bg-[#f2ece3] px-5 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a05f47]">
                Project collection
              </p>
              <h2 className="editorial-title mt-3 text-4xl text-[#332b25] sm:text-5xl">
                Find your next weekend project
              </h2>
              <p className="mt-3 max-w-xl leading-7 text-[#71675f]">
                Start with one available plan today. More spaces and project
                types are being carefully prepared.
              </p>
            </div>

            <nav aria-label="Project categories" className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((category, index) =>
                index === 0 ? (
                  <a
                    key={category}
                    href="#projects-grid"
                    className="shrink-0 rounded-full bg-[#667154] px-4 py-2 text-sm font-semibold text-white"
                  >
                    {category}
                  </a>
                ) : (
                  <span
                    key={category}
                    aria-disabled="true"
                    className="shrink-0 rounded-full border border-[#d8ccbd] bg-[#f8f4ed] px-4 py-2 text-sm text-[#8a7e73]"
                    title={`${category} projects coming soon`}
                  >
                    {category}
                    <span className="ml-1 text-[9px] font-semibold uppercase tracking-wider text-[#aa9e92]">
                      Soon
                    </span>
                  </span>
                )
              )}
            </nav>
          </div>

          <div id="projects-grid" className="mt-10 grid gap-8 md:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.title}
                className="group overflow-hidden rounded-[1.75rem] border border-[#ded4c6] bg-[#fffdf9] shadow-[0_12px_40px_rgba(85,67,48,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-[#c7b8a5] hover:shadow-[0_24px_60px_rgba(85,67,48,0.14)]"
              >
                <div className="relative overflow-hidden">
                  <ProjectIllustration tone={project.tone} kind={project.kind} />
                  <span
                    className={`absolute left-5 top-5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${
                      project.available
                        ? "bg-[#edf1e7] text-[#596348]"
                        : "bg-[#fffaf1]/90 text-[#81756a] backdrop-blur"
                    }`}
                  >
                    {project.available ? "Available now" : "Coming soon"}
                  </span>
                </div>

                <div className="p-6 sm:p-8">
                  <h3 className="editorial-title text-3xl leading-tight text-[#332b25]">
                    {project.title}
                  </h3>
                  <p className="mt-3 min-h-14 leading-7 text-[#71675f]">
                    {project.description}
                  </p>

                  <dl className="my-7 grid grid-cols-3 divide-x divide-[#e7ded2] border-y border-[#e7ded2] py-4 text-sm">
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
                      className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#667154] px-5 py-3 font-semibold text-white transition-all hover:bg-[#566146] hover:shadow-lg"
                    >
                      Customize this project
                    </Link>
                  ) : (
                    <div className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#eee8df] px-5 py-3 font-semibold text-[#9a8e83]">
                      In the workshop
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
