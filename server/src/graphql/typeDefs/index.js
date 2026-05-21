const typeDefs = `#graphql
  # ============ ENUMS ============
  enum Role {
    admin
    hr
    employee
    client
    manager
    account
    team_leader
  }

  enum RAGStatus {
    green
    amber
    red
  }

  enum ProjectStatus {
    planning
    active
    on_hold
    completed
    cancelled
  }

  enum TaskStatus {
    todo
    in_progress
    review
    completed
  }

  enum TaskPriority {
    low
    medium
    high
    critical
  }

  enum AttendanceStatus {
    present
    absent
    late
    half_day
    leave
    holiday
  }

  enum LeaveType {
    casual
    sick
    earned
    maternity
    paternity
    unpaid
  }

  enum LeaveStatus {
    pending
    approved
    rejected
  }

  enum ClientStatus {
    active
    inactive
    prospect
  }

  enum WorkType {
    office
    remote
    hybrid
  }

  # ============ TYPES ============
  type User {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    role: Role!
    avatar: String
    phone: String
    isActive: Boolean!
    lastLogin: String
    fullName: String
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  type Employee {
    id: ID!
    userId: User!
    employeeId: String!
    designation: String!
    department: Department
    salary: Salary
    joiningDate: String
    skills: [String]
    ragStatus: RAGStatus
    performanceScore: Float
    manager: Employee
    workType: WorkType
    bio: String
    attendanceSummary: AttendanceSummary
    createdAt: String!
    updatedAt: String!
  }

  type AttendanceSummary {
    presentDays: Int!
    totalDays: Int!
  }

  type Salary {
    base: Float
    bonus: Float
    deductions: Float
  }

  type Department {
    id: ID!
    name: String!
    head: Employee
    description: String
    budget: Float
    color: String
    employeeCount: Int
    createdAt: String!
    updatedAt: String!
  }

  type Project {
    id: ID!
    name: String!
    description: String
    client: Client
    team: [Employee]
    projectManager: Employee
    startDate: String
    deadline: String!
    progress: Float!
    ragStatus: RAGStatus!
    milestones: [Milestone]
    budget: Budget
    status: ProjectStatus!
    priority: TaskPriority
    tags: [String]
    techStack: [String]
    taskCount: Int
    createdAt: String!
    updatedAt: String!
  }

  type Milestone {
    title: String!
    description: String
    dueDate: String
    completed: Boolean!
    completedAt: String
  }

  type Budget {
    allocated: Float
    spent: Float
  }

  type Task {
    id: ID!
    title: String!
    description: String
    project: Project!
    assignedTo: Employee
    assignedBy: User
    priority: TaskPriority!
    status: TaskStatus!
    dueDate: String
    estimatedHours: Float
    actualHours: Float
    tags: [String]
    attachments: [Attachment]
    comments: [Comment]
    order: Int
    createdAt: String!
    updatedAt: String!
  }

  type Attachment {
    name: String
    url: String
    uploadedAt: String
  }

  type Comment {
    user: User
    text: String!
    createdAt: String!
  }

  type Attendance {
    id: ID!
    employee: Employee!
    date: String!
    checkIn: String
    checkOut: String
    status: AttendanceStatus!
    workHours: Float
    overtime: Float
    location: Location
    notes: String
    createdAt: String!
  }

  type Location {
    lat: Float
    lng: Float
    address: String
  }

  type Client {
    id: ID!
    companyName: String!
    contactPerson: String!
    email: String!
    phone: String
    industry: String
    website: String
    projects: [Project]
    meetings: [Meeting]
    followUpDate: String
    ragStatus: RAGStatus
    contractValue: Float
    status: ClientStatus!
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  type Meeting {
    date: String!
    title: String
    notes: String
    status: String
  }

  type Leave {
    id: ID!
    employee: Employee!
    type: LeaveType!
    startDate: String!
    endDate: String!
    reason: String!
    status: LeaveStatus!
    approvedBy: User
    days: Int
    createdAt: String!
  }

  type Notification {
    id: ID!
    recipient: User!
    type: String!
    title: String!
    message: String!
    isRead: Boolean!
    link: String
    createdAt: String!
  }

  # ============ DASHBOARD ANALYTICS ============
  type DashboardStats {
    totalEmployees: Int!
    totalProjects: Int!
    totalTasks: Int!
    totalClients: Int!
    activeProjects: Int!
    pendingTasks: Int!
    presentToday: Int!
    pendingLeaves: Int!
    projectsByStatus: [StatusCount]
    tasksByStatus: [StatusCount]
    ragDistribution: [StatusCount]
    recentActivities: [Activity]
    monthlyAttendance: [MonthlyData]
    projectProgress: [ProjectProgressData]
  }

  type StatusCount {
    status: String!
    count: Int!
  }

  type Activity {
    id: ID!
    type: String!
    message: String!
    timestamp: String!
    user: String
  }

  type MonthlyData {
    month: String!
    present: Int!
    absent: Int!
    late: Int!
  }

  type ProjectProgressData {
    name: String!
    progress: Float!
    ragStatus: String!
  }

  # ============ AI RAG ============
  type AIResponse {
    answer: String!
    sources: [String]
    confidence: Float
    sessionId: ID
  }

  type AIChatMessage {
    role: String!
    content: String!
    timestamp: String!
  }

  type AIChatSession {
    id: ID!
    user: User!
    title: String!
    messages: [AIChatMessage!]!
    createdAt: String!
    updatedAt: String!
  }

  # ============ INPUTS ============
  input RegisterInput {
    firstName: String!
    lastName: String!
    email: String!
    password: String!
    role: Role
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input EmployeeInput {
    userId: ID
    firstName: String
    lastName: String
    email: String
    password: String
    designation: String!
    department: ID
    salary: SalaryInput
    joiningDate: String
    skills: [String]
    workType: WorkType
    bio: String
    phone: String
    role: Role
  }

  input SalaryInput {
    base: Float
    bonus: Float
    deductions: Float
  }

  input DepartmentInput {
    name: String!
    head: ID
    description: String
    budget: Float
    color: String
  }

  input ProjectInput {
    name: String!
    description: String
    client: ID
    team: [ID]
    projectManager: ID
    startDate: String
    deadline: String!
    status: ProjectStatus
    priority: TaskPriority
    tags: [String]
    techStack: [String]
    budget: BudgetInput
  }

  input BudgetInput {
    allocated: Float
    spent: Float
  }

  input MilestoneInput {
    title: String!
    description: String
    dueDate: String
  }

  input TaskInput {
    title: String!
    description: String
    project: ID!
    assignedTo: ID
    priority: TaskPriority
    status: TaskStatus
    dueDate: String
    estimatedHours: Float
    tags: [String]
  }

  input TaskUpdateInput {
    title: String
    description: String
    assignedTo: ID
    priority: TaskPriority
    status: TaskStatus
    dueDate: String
    estimatedHours: Float
    actualHours: Float
    tags: [String]
    order: Int
  }

  input AttendanceInput {
    employee: ID!
    date: String!
    checkIn: String
    checkOut: String
    status: AttendanceStatus
    notes: String
  }

  input ClientInput {
    companyName: String!
    contactPerson: String!
    email: String!
    phone: String
    industry: String
    website: String
    contractValue: Float
    status: ClientStatus
    notes: String
  }

  input LeaveInput {
    type: LeaveType!
    startDate: String!
    endDate: String!
    reason: String!
  }

  input MeetingInput {
    clientId: ID!
    date: String!
    title: String
    notes: String
  }

  # ============ QUERIES ============
  type Query {
    # Auth
    me: User
    
    # Users
    users(role: Role): [User!]!
    user(id: ID!): User
    
    # Employees
    employees(department: ID, ragStatus: RAGStatus): [Employee!]!
    employee(id: ID!): Employee
    
    # Departments
    departments: [Department!]!
    department(id: ID!): Department
    
    # Projects
    projects(status: ProjectStatus, ragStatus: RAGStatus): [Project!]!
    project(id: ID!): Project
    
    # Tasks
    tasks(project: ID, status: TaskStatus, assignedTo: ID): [Task!]!
    task(id: ID!): Task
    myTasks: [Task!]!
    
    # Attendance
    attendanceRecords(employee: ID, startDate: String, endDate: String): [Attendance!]!
    myAttendance(startDate: String, endDate: String): [Attendance!]!
    todayAttendance: Attendance
    
    # Clients
    clients(status: ClientStatus, ragStatus: RAGStatus): [Client!]!
    client(id: ID!): Client
    
    # Leaves
    leaves(employee: ID, status: LeaveStatus): [Leave!]!
    myLeaves: [Leave!]!
    
    # Notifications
    notifications(unreadOnly: Boolean): [Notification!]!
    unreadNotificationCount: Int!
    
    # Dashboard
    dashboardStats: DashboardStats!
    
    # AI
    askAI(question: String!, sessionId: ID): AIResponse!
    myChatSessions: [AIChatSession!]!
    chatSession(id: ID!): AIChatSession
  }

  # ============ MUTATIONS ============
  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    refreshToken(token: String!): AuthPayload!
    
    # Employees
    createEmployee(input: EmployeeInput!): Employee!
    updateEmployee(id: ID!, input: EmployeeInput!): Employee!
    deleteEmployee(id: ID!): Boolean!
    
    # Departments
    createDepartment(input: DepartmentInput!): Department!
    updateDepartment(id: ID!, input: DepartmentInput!): Department!
    deleteDepartment(id: ID!): Boolean!
    
    # Projects
    createProject(input: ProjectInput!): Project!
    updateProject(id: ID!, input: ProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
    updateProjectProgress(id: ID!, progress: Float!): Project!
    addMilestone(projectId: ID!, input: MilestoneInput!): Project!
    completeMilestone(projectId: ID!, milestoneIndex: Int!): Project!
    
    # Tasks
    createTask(input: TaskInput!): Task!
    updateTask(id: ID!, input: TaskUpdateInput!): Task!
    deleteTask(id: ID!): Boolean!
    addComment(taskId: ID!, text: String!): Task!
    reorderTasks(projectId: ID!, taskIds: [ID!]!): Boolean!
    
    # Attendance
    checkIn(notes: String): Attendance!
    checkOut: Attendance!
    recordAttendance(input: AttendanceInput!): Attendance!
    
    # Clients
    createClient(input: ClientInput!): Client!
    updateClient(id: ID!, input: ClientInput!): Client!
    deleteClient(id: ID!): Boolean!
    scheduleMeeting(input: MeetingInput!): Client!
    
    # Leaves
    requestLeave(input: LeaveInput!): Leave!
    approveLeave(id: ID!): Leave!
    rejectLeave(id: ID!, reason: String): Leave!
    
    # Notifications
    markNotificationRead(id: ID!): Notification!
    markAllNotificationsRead: Boolean!
    
    # AI
    syncRAGData: Boolean!
    deleteChatSession(id: ID!): Boolean!
  }

  # ============ SUBSCRIPTIONS ============
  type Subscription {
    taskUpdated(projectId: ID): Task!
    notificationReceived(userId: ID!): Notification!
    projectProgressUpdated: Project!
  }
`;

export default typeDefs;
