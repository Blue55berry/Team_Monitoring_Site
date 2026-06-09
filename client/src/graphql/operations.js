import { gql } from '@apollo/client/core';

// ============ AUTH ============
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user { id firstName lastName email role avatar isActive }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user { id firstName lastName email role avatar isActive }
    }
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($email: String!, $code: String!, $newPassword: String!) {
    resetPassword(email: $email, code: $code, newPassword: $newPassword)
  }
`;

export const GET_ME = gql`
  query Me { me { id firstName lastName email role avatar phone isActive lastLogin } }
`;

// ============ DASHBOARD ============
export const GET_DASHBOARD_STATS = gql`
  query DashboardStats {
    dashboardStats {
      totalEmployees totalProjects totalTasks totalClients
      activeProjects pendingTasks presentToday pendingLeaves
      projectsByStatus { status count }
      tasksByStatus { status count }
      ragDistribution { status count }
      monthlyAttendance { month present absent late }
      projectProgress { name progress ragStatus }
    }
  }
`;

// ============ EMPLOYEES ============
export const GET_EMPLOYEES = gql`
  query Employees($department: ID, $ragStatus: RAGStatus) {
    employees(department: $department, ragStatus: $ragStatus) {
      id employeeId designation ragStatus performanceScore workType bio
      userId { id firstName lastName email avatar phone role }
      department { id name color }
      salary { base bonus deductions }
      attendanceSummary { presentDays totalDays }
      skills createdAt
    }
  }
`;

export const GET_EMPLOYEE = gql`
  query Employee($id: ID!) {
    employee(id: $id) {
      id employeeId designation ragStatus performanceScore workType bio joiningDate
      userId { id firstName lastName email avatar phone }
      department { id name color }
      salary { base bonus deductions }
      manager { id employeeId userId { firstName lastName } }
      skills createdAt updatedAt
    }
  }
`;

export const CREATE_EMPLOYEE = gql`
  mutation CreateEmployee($input: EmployeeInput!) {
    createEmployee(input: $input) {
      id employeeId designation
      userId { id firstName lastName email }
      department { id name }
    }
  }
`;

export const UPDATE_EMPLOYEE = gql`
  mutation UpdateEmployee($id: ID!, $input: EmployeeInput!) {
    updateEmployee(id: $id, input: $input) {
      id employeeId designation ragStatus performanceScore
      userId { id firstName lastName email }
    }
  }
`;

export const DELETE_EMPLOYEE = gql`
  mutation DeleteEmployee($id: ID!) { deleteEmployee(id: $id) }
`;

// ============ DEPARTMENTS ============
export const GET_DEPARTMENTS = gql`
  query Departments {
    departments {
      id name description budget color employeeCount
      head { id userId { firstName lastName } }
    }
  }
`;

export const CREATE_DEPARTMENT = gql`
  mutation CreateDepartment($input: DepartmentInput!) {
    createDepartment(input: $input) { id name description budget color }
  }
`;

// ============ PROJECTS ============
export const GET_PROJECTS = gql`
  query Projects($status: ProjectStatus, $ragStatus: RAGStatus) {
    projects(status: $status, ragStatus: $ragStatus) {
      id name description progress ragStatus status priority deadline startDate
      tags techStack taskCount
      client { id companyName }
      team { id userId { firstName lastName avatar } }
      projectManager { id userId { firstName lastName } }
      budget { allocated spent }
      milestones { title dueDate completed completedAt }
      createdAt updatedAt
    }
  }
`;

export const GET_PROJECT = gql`
  query Project($id: ID!) {
    project(id: $id) {
      id name description progress ragStatus status priority deadline startDate
      tags techStack taskCount
      client { id companyName }
      team { id employeeId designation userId { id firstName lastName avatar email } }
      projectManager { id userId { firstName lastName } }
      budget { allocated spent }
      milestones { title description dueDate completed completedAt }
      createdAt updatedAt
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject($input: ProjectInput!) {
    createProject(input: $input) { id name status ragStatus }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $input: ProjectInput!) {
    updateProject(id: $id, input: $input) { id name status progress ragStatus }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) { deleteProject(id: $id) }
`;

// ============ TASKS ============
export const GET_TASKS = gql`
  query Tasks($project: ID, $status: TaskStatus, $assignedTo: ID) {
    tasks(project: $project, status: $status, assignedTo: $assignedTo) {
      id title description priority status dueDate estimatedHours actualHours tags order
      project { id name }
      assignedTo { id userId { firstName lastName avatar } }
      assignedBy { id firstName lastName }
      comments { user { id firstName lastName } text createdAt }
      createdAt updatedAt
    }
  }
`;

export const GET_MY_TASKS = gql`
  query MyTasks {
    myTasks {
      id title description priority status dueDate estimatedHours actualHours tags
      project { id name }
      createdAt
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) {
      id title status priority
      assignedTo { id userId { firstName lastName } }
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: TaskUpdateInput!) {
    updateTask(id: $id, input: $input) {
      id title status priority order
      assignedTo { id userId { firstName lastName } }
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) { deleteTask(id: $id) }
`;

// ============ CLIENTS ============
export const GET_CLIENTS = gql`
  query Clients($status: ClientStatus, $ragStatus: RAGStatus) {
    clients(status: $status, ragStatus: $ragStatus) {
      id companyName contactPerson email phone industry website
      ragStatus contractValue status followUpDate notes
      meetings { date title notes status }
      createdAt updatedAt
    }
  }
`;

export const CREATE_CLIENT = gql`
  mutation CreateClient($input: ClientInput!) {
    createClient(input: $input) { id companyName contactPerson status }
  }
`;

export const UPDATE_CLIENT = gql`
  mutation UpdateClient($id: ID!, $input: ClientInput!) {
    updateClient(id: $id, input: $input) { id companyName status ragStatus }
  }
`;

export const DELETE_CLIENT = gql`
  mutation DeleteClient($id: ID!) { deleteClient(id: $id) }
`;

// ============ ATTENDANCE ============
export const GET_MY_ATTENDANCE = gql`
  query MyAttendance($startDate: String, $endDate: String) {
    myAttendance(startDate: $startDate, endDate: $endDate) {
      id date checkIn checkOut status workHours overtime notes
      employee { id userId { firstName lastName } }
    }
  }
`;

export const GET_TODAY_ATTENDANCE = gql`
  query TodayAttendance { todayAttendance { id date checkIn checkOut status workHours } }
`;

export const CHECK_IN = gql`
  mutation CheckIn($notes: String) {
    checkIn(notes: $notes) { id date checkIn status }
  }
`;

export const CHECK_OUT = gql`
  mutation CheckOut { checkOut { id date checkOut status workHours overtime } }
`;

export const GET_ATTENDANCE_RECORDS = gql`
  query AttendanceRecords($employee: ID, $startDate: String, $endDate: String) {
    attendanceRecords(employee: $employee, startDate: $startDate, endDate: $endDate) {
      id date checkIn checkOut status workHours overtime notes
      employee { id employeeId userId { firstName lastName } department { id name color } }
    }
  }
`;

// ============ LEAVES ============
export const GET_LEAVES = gql`
  query Leaves($employee: ID, $status: LeaveStatus) {
    leaves(employee: $employee, status: $status) {
      id type startDate endDate reason status days
      employee { id userId { firstName lastName } }
      approvedBy { id firstName lastName }
      createdAt
    }
  }
`;

export const GET_MY_LEAVES = gql`
  query MyLeaves {
    myLeaves { id type startDate endDate reason status days createdAt }
  }
`;

export const REQUEST_LEAVE = gql`
  mutation RequestLeave($input: LeaveInput!) {
    requestLeave(input: $input) { id type startDate endDate status }
  }
`;

export const APPROVE_LEAVE = gql`
  mutation ApproveLeave($id: ID!) {
    approveLeave(id: $id) { id status approvedBy { firstName lastName } }
  }
`;

export const REJECT_LEAVE = gql`
  mutation RejectLeave($id: ID!, $reason: String) {
    rejectLeave(id: $id, reason: $reason) { id status }
  }
`;

// ============ NOTIFICATIONS ============
export const GET_NOTIFICATIONS = gql`
  query Notifications($unreadOnly: Boolean) {
    notifications(unreadOnly: $unreadOnly) { id type title message isRead link createdAt }
  }
`;

export const GET_UNREAD_COUNT = gql`
  query UnreadCount { unreadNotificationCount }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkRead($id: ID!) { markNotificationRead(id: $id) { id isRead } }
`;

export const MARK_ALL_READ = gql`
  mutation MarkAllRead { markAllNotificationsRead }
`;

// ============ AI ============
export const ASK_AI = gql`
  query AskAI($question: String!, $sessionId: ID) {
    askAI(question: $question, sessionId: $sessionId) {
      answer
      sources
      confidence
      sessionId
    }
  }
`;

export const GET_MY_CHAT_SESSIONS = gql`
  query MyChatSessions {
    myChatSessions {
      id title createdAt updatedAt
    }
  }
`;

export const GET_CHAT_SESSION = gql`
  query ChatSession($id: ID!) {
    chatSession(id: $id) {
      id title createdAt updatedAt
      messages { role content timestamp }
    }
  }
`;

export const DELETE_CHAT_SESSION = gql`
  mutation DeleteChatSession($id: ID!) {
    deleteChatSession(id: $id)
  }
`;


