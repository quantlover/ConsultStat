import { 
  users, projects, students, timeEntries, invoices, invoiceItems, projectStudents,
  type User, type InsertUser, type Project, type InsertProject, type Student, type InsertStudent,
  type TimeEntry, type InsertTimeEntry, type Invoice, type InsertInvoice, type InvoiceItem, type InsertInvoiceItem,
  type ProjectStudent, type InsertProjectStudent
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string, userId: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>, userId: string): Promise<Project | undefined>;
  deleteProject(id: string, userId: string): Promise<boolean>;
  
  // Student methods
  getStudents(userId: string): Promise<Student[]>;
  getStudent(id: string, userId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>, userId: string): Promise<Student | undefined>;
  deleteStudent(id: string, userId: string): Promise<boolean>;
  
  // Project-Student methods
  assignStudentToProject(assignment: InsertProjectStudent): Promise<ProjectStudent>;
  getProjectStudents(projectId: string): Promise<(ProjectStudent & { student: Student })[]>;
  removeStudentFromProject(projectId: string, studentId: string): Promise<boolean>;
  
  // Time entry methods
  getTimeEntries(userId: string): Promise<(TimeEntry & { project: Project })[]>;
  getTimeEntriesByProject(projectId: string, userId: string): Promise<TimeEntry[]>;
  getActiveTimeEntry(userId: string): Promise<(TimeEntry & { project: Project }) | undefined>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, timeEntry: Partial<InsertTimeEntry>, userId: string): Promise<TimeEntry | undefined>;
  stopTimeEntry(id: string, endTime: Date, userId: string): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: string, userId: string): Promise<boolean>;
  
  // Invoice methods
  getInvoices(userId: string): Promise<(Invoice & { project: Project })[]>;
  getInvoice(id: string, userId: string): Promise<(Invoice & { project: Project; items: (InvoiceItem & { timeEntry: TimeEntry })[] }) | undefined>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>, userId: string): Promise<Invoice | undefined>;
  deleteInvoice(id: string, userId: string): Promise<boolean>;
  
  // Dashboard methods
  getDashboardMetrics(userId: string): Promise<{
    activeProjects: number;
    hoursThisMonth: number;
    pendingInvoicesAmount: number;
    studentsAssigned: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProjects(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string, userId: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>, userId: string): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    return updatedProject || undefined;
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return result.rowCount > 0;
  }

  async getStudents(userId: string): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.userId, userId)).orderBy(asc(students.name));
  }

  async getStudent(id: string, userId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(and(eq(students.id, id), eq(students.userId, userId)));
    return student || undefined;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: string, student: Partial<InsertStudent>, userId: string): Promise<Student | undefined> {
    const [updatedStudent] = await db
      .update(students)
      .set(student)
      .where(and(eq(students.id, id), eq(students.userId, userId)))
      .returning();
    return updatedStudent || undefined;
  }

  async deleteStudent(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(students).where(and(eq(students.id, id), eq(students.userId, userId)));
    return result.rowCount > 0;
  }

  async assignStudentToProject(assignment: InsertProjectStudent): Promise<ProjectStudent> {
    const [newAssignment] = await db.insert(projectStudents).values(assignment).returning();
    return newAssignment;
  }

  async getProjectStudents(projectId: string): Promise<(ProjectStudent & { student: Student })[]> {
    return await db
      .select()
      .from(projectStudents)
      .innerJoin(students, eq(projectStudents.studentId, students.id))
      .where(eq(projectStudents.projectId, projectId))
      .then(rows => rows.map(row => ({ ...row.project_students, student: row.students })));
  }

  async removeStudentFromProject(projectId: string, studentId: string): Promise<boolean> {
    const result = await db
      .delete(projectStudents)
      .where(and(eq(projectStudents.projectId, projectId), eq(projectStudents.studentId, studentId)));
    return result.rowCount > 0;
  }

  async getTimeEntries(userId: string): Promise<(TimeEntry & { project: Project })[]> {
    return await db
      .select()
      .from(timeEntries)
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .where(eq(timeEntries.userId, userId))
      .orderBy(desc(timeEntries.createdAt))
      .then(rows => rows.map(row => ({ ...row.time_entries, project: row.projects })));
  }

  async getTimeEntriesByProject(projectId: string, userId: string): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.projectId, projectId), eq(timeEntries.userId, userId)))
      .orderBy(desc(timeEntries.startTime));
  }

  async getActiveTimeEntry(userId: string): Promise<(TimeEntry & { project: Project }) | undefined> {
    const [result] = await db
      .select()
      .from(timeEntries)
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .where(and(eq(timeEntries.userId, userId), eq(timeEntries.isRunning, true)));
    
    return result ? { ...result.time_entries, project: result.projects } : undefined;
  }

  async createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const [newTimeEntry] = await db.insert(timeEntries).values(timeEntry).returning();
    return newTimeEntry;
  }

  async updateTimeEntry(id: string, timeEntry: Partial<InsertTimeEntry>, userId: string): Promise<TimeEntry | undefined> {
    const [updatedTimeEntry] = await db
      .update(timeEntries)
      .set(timeEntry)
      .where(and(eq(timeEntries.id, id), eq(timeEntries.userId, userId)))
      .returning();
    return updatedTimeEntry || undefined;
  }

  async stopTimeEntry(id: string, endTime: Date, userId: string): Promise<TimeEntry | undefined> {
    const [timeEntry] = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.id, id), eq(timeEntries.userId, userId)));
    
    if (!timeEntry) return undefined;

    const startTime = new Date(timeEntry.startTime);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // in hours

    const [updatedTimeEntry] = await db
      .update(timeEntries)
      .set({
        endTime,
        duration: duration.toString(),
        isRunning: false,
      })
      .where(and(eq(timeEntries.id, id), eq(timeEntries.userId, userId)))
      .returning();
    
    return updatedTimeEntry || undefined;
  }

  async deleteTimeEntry(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(timeEntries).where(and(eq(timeEntries.id, id), eq(timeEntries.userId, userId)));
    return result.rowCount > 0;
  }

  async getInvoices(userId: string): Promise<(Invoice & { project: Project })[]> {
    return await db
      .select()
      .from(invoices)
      .innerJoin(projects, eq(invoices.projectId, projects.id))
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt))
      .then(rows => rows.map(row => ({ ...row.invoices, project: row.projects })));
  }

  async getInvoice(id: string, userId: string): Promise<(Invoice & { project: Project; items: (InvoiceItem & { timeEntry: TimeEntry })[] }) | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .innerJoin(projects, eq(invoices.projectId, projects.id))
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));

    if (!invoice) return undefined;

    const items = await db
      .select()
      .from(invoiceItems)
      .innerJoin(timeEntries, eq(invoiceItems.timeEntryId, timeEntries.id))
      .where(eq(invoiceItems.invoiceId, id))
      .then(rows => rows.map(row => ({ ...row.invoice_items, timeEntry: row.time_entries })));

    return {
      ...invoice.invoices,
      project: invoice.projects,
      items,
    };
  }

  async createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    return await db.transaction(async (tx) => {
      const [newInvoice] = await tx.insert(invoices).values(invoice).returning();
      
      if (items.length > 0) {
        await tx.insert(invoiceItems).values(
          items.map(item => ({ ...item, invoiceId: newInvoice.id }))
        );
      }
      
      return newInvoice;
    });
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>, userId: string): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    return updatedInvoice || undefined;
  }

  async deleteInvoice(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
    return result.rowCount > 0;
  }

  async getDashboardMetrics(userId: string): Promise<{
    activeProjects: number;
    hoursThisMonth: number;
    pendingInvoicesAmount: number;
    studentsAssigned: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Active projects count
    const [activeProjectsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.status, 'active')));

    // Hours this month
    const [hoursResult] = await db
      .select({ 
        totalHours: sql<number>`COALESCE(SUM(CAST(duration AS DECIMAL)), 0)` 
      })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, userId),
          gte(timeEntries.startTime, startOfMonth),
          lte(timeEntries.startTime, endOfMonth),
          eq(timeEntries.isRunning, false)
        )
      );

    // Pending invoices amount
    const [pendingInvoicesResult] = await db
      .select({ 
        totalAmount: sql<number>`COALESCE(SUM(CAST(total AS DECIMAL)), 0)` 
      })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, 'sent')));

    // Students assigned count
    const [studentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(students)
      .where(eq(students.userId, userId));

    return {
      activeProjects: activeProjectsResult.count,
      hoursThisMonth: hoursResult.totalHours || 0,
      pendingInvoicesAmount: pendingInvoicesResult.totalAmount || 0,
      studentsAssigned: studentsResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
