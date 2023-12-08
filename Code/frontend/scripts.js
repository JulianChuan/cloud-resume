document.addEventListener("DOMContentLoaded", function () {
  const timelineData = [
    {
      date: "ActiveDraft | September 2023 - Present",
      title: "Solutions Engineer",
      description: `Revolutionized cloud-based collaboration platforms for architects, designers, and construction teams. Spearheaded customer acquisitions, crafted strategic partnerships, and authored groundbreaking technical documentation, slashing onboarding time by 30%. Seamlessly guided clients through product demonstrations, fostering continual learning through Active Academy.`,
    },

    {
      date: "Immutable | September 2022 - September 2023",
      title: "Integration Engineer",
      description: `Elevated blockchain integration strategies, minting over 960 NFTs and transforming digital ecosystems through cutting-edge Web3 integration. Guided high-touch clients and billion-dollar businesses in integrating Immutable X protocol, driving unparalleled opportunities in blockchain-based applications.`,
    },
    {
      date: "ZenLedger | June 2022 - September 2022",
      title: "(Q3-Q4) Growth / Product Development Specialist",
      description: `Optimized sales performance with dynamic funnels and outreach strategies, launching APIs for Avalanche and Fantom blockchains. Enhanced Uniswap liquidity pool functionality, empowering professionals in navigating cryptocurrency taxation effectively.`,
    },
    {
      date: "ZenLedger | January 2022 - June 2022",
      title: "(Q1-Q2) Solutions Engineer",
      description: `Empowered prestigious organizations like RSM, EY, and government entities through captivating demonstrations, webinars, and educational initiatives. Developed Zenledger University, educating users on cryptocurrency and blockchain fundamentals.`,
    },
    {
      date: "Appsketiers | August 2018 - December 2021",
      title: "Account Executive",
      description:
        "Fostered exceptional client relationships, smashing sales targets, and achieving revenue growth of over $1.4M. Managed and nurtured 340+ accounts, highlighting the tangible impact of expertise and exceptional customer experience.",
    },
    {
      date: "Appsketiers | May 2018 - June 2020",
      title: "Product Designer",
      description:
        "Designed intuitive mobile applications, boosting user satisfaction and engagement for over 30 B2B and B2C clients. Implemented Agile practices, slashing project delays by 30%, and nurturing a culture of innovation and self-organization.",
    },
  ];

  const timeline = document.getElementById("timeline");

  timelineData.forEach((item, index) => {
    let entry = document.createElement("div");
    entry.classList.add("timeline-entry");
    entry.setAttribute("id", "entry-" + index);

    let dot = document.createElement("div");
    dot.classList.add("timeline-dot");

    let date = document.createElement("div");
    date.textContent = item.date;
    date.classList.add("timeline-date");

    let content = document.createElement("div");
    content.classList.add("timeline-content");
    content.setAttribute("id", "content-" + index);

    let title = document.createElement("h3");
    title.textContent = item.title;

    let description = document.createElement("p");
    description.textContent = item.description;
    description.style.display = "none"; // Initially hide the description

    // Click event to toggle the description visibility
    entry.addEventListener("click", function () {
      description.style.display =
        description.style.display === "none" ? "block" : "none";
    });

    content.appendChild(title);
    content.appendChild(description);

    entry.appendChild(dot);
    entry.appendChild(date);
    entry.appendChild(content);

    timeline.appendChild(entry);
  });
});
