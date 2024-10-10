# DataForge Project Documentation

## Table of Contents

1. [Introduction](#1-introduction)
2. [Problem Definition](#2-problem-definition)
3. [Objective](#3-objective)
4. [Related Works](#4-related-works)
5. [System Architecture](#5-system-architecture)
6. [Functional Requirements](#6-functional-requirements)
7. [Use Case Diagram](#7-use-case-diagram)
8. [Software & Hardware Tools](#8-software--hardware-tools)
9. [Time Plan](#9-time-plan)

---

## 1. Introduction

In today's data-driven landscape, organizations increasingly rely on data warehouses to consolidate and analyze vast amounts of information from disparate sources. A well-designed data warehouse schema is crucial for efficient data storage, retrieval, and analysis, enabling businesses to make informed decisions. However, designing such schemas manually can be time-consuming and error-prone, especially as data complexity grows. This project presents **DataForge**, a tool designed to automate the creation of data warehouse schemas. Leveraging both backend processing and an interactive frontend interface, DataForge simplifies schema design, enhances accuracy, and integrates AI-driven suggestions to optimize data structures. Additionally, DataForge empowers users to refine and customize generated schemas, ensuring they align perfectly with specific business requirements.

## 2. Problem Definition

Designing data warehouse schemas involves identifying and organizing fact and dimension tables, defining primary and foreign keys, and ensuring consistency across various data sources. Manual schema generation poses several challenges:

- **Time-Consuming Process:** Manually parsing SQL files and designing schemas can be labor-intensive, delaying data integration projects.
- **Human Error:** Mistakes in identifying relationships or defining keys can lead to inefficient queries and unreliable data insights.
- **Scalability Issues:** As data volumes and complexity increase, maintaining and updating schemas manually becomes impractical.
- **Lack of Optimization:** Without automated tools, optimizing schemas for performance and scalability is challenging, potentially leading to suboptimal data structures.
- **Limited Flexibility:** Manual processes may not easily accommodate dynamic changes or specific customization needs from different business domains.

These challenges highlight the need for an automated solution that can efficiently generate accurate and optimized data warehouse schemas from existing SQL databases while providing flexibility for user-driven enhancements.

## 3. Objective

The primary objective of the **DataForge** project is to develop an automated tool that streamlines the creation of data warehouse schemas. Specifically, the project aims to:

1. **Automate Schema Parsing:** Efficiently parse SQL files to extract table definitions, columns, and relationships.
2. **Generate Fact and Dimension Tables:** Automatically identify and categorize tables as fact or dimension tables based on foreign key relationships.
3. **Enhance Schemas with AI:** Utilize AI services to detect domains, suggest missing tables or columns, and generate enhanced schemas tailored to specific business domains.
4. **Provide Interactive Visualization:** Offer a user-friendly frontend interface that visualizes the generated schemas, allowing users to explore and interact with the schema structure.
5. **Enable User Customization:** Allow users to edit and modify the generated schemas post-generation to accommodate specific business needs and preferences.
6. **Ensure Scalability and Accuracy:** Design the system to handle large and complex databases while maintaining high accuracy in schema generation and optimization.

By achieving these objectives, DataForge seeks to facilitate efficient data warehouse design, reduce manual effort, enhance the reliability and performance of data analytics systems, and provide flexibility for user-driven schema customization.

## 4. Related Works

Several tools and frameworks exist for data warehouse schema design and automation. Notable among them are:

- **Talend Data Integration:** A comprehensive data integration platform that offers tools for ETL (Extract, Transform, Load) processes, including schema mapping and data transformation.
- **Informatica PowerCenter:** An enterprise data integration solution that provides features for data profiling, mapping, and transformation, aiding in schema design.
- **Microsoft SQL Server Integration Services (SSIS):** A platform for building enterprise-level data integration and transformation solutions, including schema generation tools.
- **ER/Studio:** A data modeling tool that supports the design and visualization of complex data warehouse schemas, offering features like reverse engineering from existing databases.
- **dbt (Data Build Tool):** A command-line tool that enables data analysts and engineers to transform data in their warehouse more effectively by managing data models and transformations.

While these tools offer robust features for data integration and schema design, **DataForge** distinguishes itself by integrating AI-driven enhancements, providing an interactive visualization frontend, and enabling user-driven schema customization tailored specifically for automated schema generation from SQL files.

## 5. System Architecture

The **DataForge** comprises a modular architecture divided into frontend and backend components, facilitating seamless interaction and efficient processing.

### Frontend

- **Framework:** Built using **React**, the frontend provides an interactive user interface for users to upload SQL files, visualize generated schemas, explore AI-driven suggestions, and customize schemas.
- **Components:**
  - **SchemaGraph.jsx:** Renders the schema visualization using **ReactFlow**, displaying fact and dimension tables as nodes with defined relationships.
  - **SchemaResult.jsx:** Manages data fetching from backend APIs, handles loading states, and displays AI suggestions, missing elements, and editing options.
  - **Layout.jsx:** Provides the overall layout structure, ensuring a consistent user experience across different views.
  - **ErrorBoundary.jsx:** Captures and displays frontend errors gracefully to enhance user experience.
  - **SchemaEditor.jsx:** Allows users to edit and modify the generated schemas interactively.

### Backend

- **Framework:** Developed using **Django** with the **Django REST Framework (DRF)**, the backend handles data processing, schema generation, AI enhancements, and manages user-driven schema edits.
- **Components:**
  - **Models:** Defines the `UserDatabase` model to store uploaded schemas, generated schemas, AI suggestions, user edits, and metadata.
  - **Views:** Implements API endpoints for uploading schemas, retrieving generated schemas, fetching metadata, and updating schemas based on user edits.
  - **Serializers:** Transforms model instances into JSON for API responses and validates incoming data.
  - **Utilities:** Includes modules for parsing SQL files, generating warehouse schemas, integrating AI services, and processing user edits.
  - **AI Services:** Provides functions to detect domains, suggest missing elements, and generate enhanced schemas using AI algorithms.

### Data Flow

1. **Upload:** Users upload SQL schema files via the frontend, which sends the files to the backend API.
2. **Parsing:** The backend parses the SQL files to extract table definitions, columns, and relationships.
3. **Schema Generation:** Based on parsed data, the backend generates fact and dimension tables, identifies primary and foreign keys, and structures the warehouse schema.
4. **AI Enhancements:** AI services analyze the schema to detect the domain, suggest missing tables or columns, and provide optimized schema enhancements.
5. **Storage:** The generated schemas, AI suggestions, and any user edits are stored in the `UserDatabase` model.
6. **Visualization:** The frontend fetches the generated schemas and visualizes them using interactive graphs, allowing users to explore, interact with, and edit the schema structure.
7. **Editing:** Users can modify the generated schemas through the frontend interface, with changes being sent to the backend for processing and storage.

### Diagram

![System Architecture Diagram](./Digrams/System%20Architecture%20for%20DataForg1.png)  
_Note: Include a visual diagram representing the frontend and backend components, data flow, and interactions between modules. Tools like Microsoft Visio, Lucidchart, or draw.io can be used to create a comprehensive diagram._

## 6. Functional Requirements

The **DataForge** must fulfill the following functional requirements:

1. **User Authentication:**

   - Allow users to create accounts, log in, and manage their sessions securely.

2. **Schema Upload:**

   - Enable users to upload SQL schema files through the frontend interface.
   - Validate uploaded files to ensure they contain valid SQL statements.

3. **Schema Parsing:**

   - Parse uploaded SQL files to extract table names, columns, data types, primary keys, and foreign key relationships.

4. **Warehouse Schema Generation:**

   - Automatically categorize tables as fact or dimension tables based on foreign key relationships.
   - Identify and define primary and foreign keys for each table.

5. **AI-Driven Enhancements:**

   - Detect the domain of the uploaded schema using AI algorithms.
   - Suggest missing tables and columns based on domain-specific standards.
   - Generate enhanced schemas incorporating AI suggestions for optimization.

6. **Schema Visualization:**

   - Display generated schemas as interactive graphs, distinguishing fact and dimension tables with different styles.
   - Allow users to select and view detailed information about individual tables and their attributes.

7. **Schema Editing:**

   - Provide functionality for users to edit and modify the generated schemas post-generation.
   - Allow adding, removing, or altering tables and columns directly through the frontend interface.
   - Ensure that edits are validated and appropriately reflected in the backend storage.

8. **AI Prompting for Schema:**

   - Enable users to prompt the system for additional AI-driven suggestions or modifications to the schema.
   - Allow users to request further optimizations or domain-specific enhancements based on the current schema.

9. **Metadata Management:**

   - Store and retrieve metadata such as domain information, AI suggestions, identified missing elements, and user edits.

10. **Error Handling:**

    - Provide meaningful error messages and feedback for invalid uploads, parsing failures, or system errors.

11. **Responsive Design:**

    - Ensure the frontend interface is responsive and accessible across various devices and screen sizes.

12. **Performance Optimization:**
    - Handle large and complex schemas efficiently, ensuring quick processing and responsive UI interactions.

## 7. Use Case Diagram

The Use Case Diagram illustrates the interactions between users and the **DataForge** system. Below is a textual representation of the primary use cases and actors involved.

### Actors

- **User:** An individual who interacts with the system to upload schemas, view generated schemas, explore AI suggestions, and edit schemas.

### Use Cases

1. **Register Account**

   - **Description:** Users create a new account to access the system.

2. **Login**

   - **Description:** Users authenticate themselves to access their dashboards.

3. **Upload SQL Schema**

   - **Description:** Users upload SQL files containing database schemas.

4. **View Generated Schema**

   - **Description:** Users visualize the automatically generated data warehouse schema.

5. **Explore AI Suggestions**

   - **Description:** Users view AI-generated suggestions for missing tables and columns.

6. **Edit Schema**

   - **Description:** Users modify the generated schemas by adding, removing, or altering tables and columns.

7. **Prompt AI for Schema Enhancements**

   - **Description:** Users request additional AI-driven suggestions or optimizations for the current schema.

8. **Download Schema Report**

   - **Description:** Users download a detailed report of the generated schema, AI suggestions, and any edits made.

9. **Manage Account**
   - **Description:** Users update their account information or change passwords.

### Diagram Representation

While a graphical diagram is ideal, below is a simplified representation using text symbols.

```
+-----------------+
|      User       |
+-----------------+
        |
        | 1. Register Account
        |
        v
+---------------------+
|       DataForge     |
+---------------------+
        |
        | 2. Login
        |
        v
+---------------------+
|   User Dashboard    |
+---------------------+
        |
        | 3. Upload SQL Schema
        |------------------------+
        |                        |
        v                        v
+-----------------+    +------------------------+
| Parse SQL File  |    | Store Uploaded Schema |
+-----------------+    +------------------------+
        |
        | 4. Generate Schema
        |
        v
+-----------------+
| Visualize Schema|
+-----------------+
        |
        | 5. Explore AI Suggestions
        |
        v
+-------------------+
|  AI Suggestions   |
+-------------------+
        |
        | 6. Edit Schema
        |
        v
+-------------------+
|   Schema Editor   |
+-------------------+
        |
        | 7. Prompt AI for Enhancements
        |
        v
+-------------------+
| AI Enhancement    |
+-------------------+
        |
        | 8. Download Schema Report
        |
        v
+---------------------+
|  Download Report    |
+---------------------+
```

_Note: For a comprehensive and visually appealing diagram, consider using tools like Microsoft Visio, Lucidchart, or draw.io to create a graphical Use Case Diagram._

## 8. Software & Hardware Tools

### Software Tools

- **Frontend:**
  - **React:** JavaScript library for building user interfaces.
  - **ReactFlow:** Library for building interactive node-based graphs.
  - **Framer Motion:** Library for animations in React.
  - **Axios:** Promise-based HTTP client for the browser.
  - **Tailwind CSS:** Utility-first CSS framework for styling.
- **Backend:**
  - **Django:** Python-based web framework.
  - **Django REST Framework (DRF):** Toolkit for building Web APIs.
  - **Python 3.12:** Programming language for backend development.
- **Database:**
  - **PostgreSQL:** Relational database management system for storing user data and schemas.
- **AI Services:**
  - **OpenAI API:** For domain detection and AI-driven schema enhancements.
- **Development Tools:**
  - **Visual Studio Code:** Integrated development environment (IDE).
  - **Git:** Version control system.
  - **Postman:** API development and testing tool.
- **Deployment:**
  - **Docker:** Containerization platform for deploying applications.
  - **AWS/GCP/Azure:** Cloud platforms for hosting backend and frontend services.

### Hardware Tools

- **Development Machines:**
  - **Personal Computers:** Desktops or laptops with sufficient processing power and memory to handle development tasks.
- **Servers:**
  - **Cloud Servers:** Virtual machines on cloud platforms (e.g., AWS EC2) for hosting the backend services.
- **Storage:**
  - **Cloud Storage Services:** For storing uploaded SQL files and generated schemas (e.g., AWS S3).

## 9. Time Plan

The project is structured to be completed over a 12-week period, divided into distinct phases to ensure timely and organized progress.

### Week 1-2: Project Planning & Requirement Analysis

- Define project scope and objectives.
- Gather and document functional and non-functional requirements.
- Design initial system architecture and select appropriate tools and technologies.

### Week 3-4: Backend Development - Schema Parsing & Generation

- Implement SQL file parsing utilities to extract table definitions, columns, and relationships.
- Develop schema generation logic to categorize tables as fact or dimension tables.
- Set up Django models, serializers, and API endpoints for schema upload and retrieval.

### Week 5-6: AI Integration & Enhancements

- Integrate AI services for domain detection and schema optimization.
- Develop AI-driven suggestions for missing tables and columns.
- Implement backend logic to incorporate AI enhancements into the generated schema.

### Week 7-8: Frontend Development - Visualization, Interaction & Editing

- Develop React components for uploading schemas and displaying results.
- Implement interactive schema visualization using ReactFlow.
- Integrate frontend with backend APIs to fetch and display generated schemas and AI suggestions.
- Develop SchemaEditor component to allow users to edit and customize schemas post-generation.

### Week 9: Testing & Quality Assurance

- Conduct unit testing for backend utilities and API endpoints.
- Perform frontend testing to ensure interactive components function correctly.
- Implement error handling and validate data integrity across the system.

### Week 10: Deployment & Documentation

- Containerize the application using Docker for consistent deployment.
- Deploy backend and frontend services to a cloud platform.
- Prepare comprehensive project documentation covering system architecture, usage guides, and technical details.

### Week 11: User Feedback & Iteration

- Conduct user testing sessions to gather feedback on system usability and functionality.
- Identify and address any issues or areas for improvement based on user feedback.
- Optimize performance and enhance features as necessary.

### Week 12: Final Review & Presentation Preparation

- Finalize all project components, ensuring they meet the defined requirements.
- Prepare presentation materials, including slides and demonstrations of the system.
- Conduct a final review to ensure readiness for project submission or demonstration.
