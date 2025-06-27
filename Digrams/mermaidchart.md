flowchart LR
subgraph DataForge["DataForge"]
direction TB
UC1(["Login"])
UC2(["Register"])
UC3(["Upload SQL Schema"])
UC4(["Parse SQL"])
UC5(["Detect Domain"])
UC6(["Generate Dimensional Schema"])
UC7(["Generate AI Suggestions"])
UC8(["View Generated Schema"])
UC9(["Explore AI Recommendations"])
UC10(["Edit Generated Schema Details"])
UC11(["Download Schema Report"])
UC12(["Manage Account"])
UC13(["Explore Dashboard"])
end
dataEng["Data Engineer"] --> UC1 & UC2 & UC3 & UC8 & UC9 & UC10 & UC11 & UC12 & UC13
UC4 --> backendSvc["Backend Service"]
UC6 --> backendSvc & postgres["PostgreSQL"]
UC7 --> backendSvc & aiService["AI Service"]
UC5 --> aiService
UC11 --> postgres
UC12 --> postgres
UC3 -. «include» .-> UC4 & UC5 & UC6
UC8 -. «include» .-> UC6
UC9 -. «include» .-> UC7
UC10 -. «extend» .-> UC8

    dataEng@{ shape: text}
    postgres@{ shape: cyl}
    style DataForge fill:#F4F6FB,stroke:#8faadc,stroke-width:2px
