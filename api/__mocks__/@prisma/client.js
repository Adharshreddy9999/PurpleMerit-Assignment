// __mocks__/@prisma/client.js for Jest (CommonJS style)
const users = [];
const projects = [];
const workspaces = [];
let idCounter = 1;

function getUserById(id) {
  return users.find(u => u.id === id);
}

// Allow test to set the acting user for permission checks
let __actingUserId = null;
function setActingUserId(id) {
  __actingUserId = id;
}
function getActingUser() {
  if (__actingUserId) return getUserById(__actingUserId);
  return users[users.length - 1];
}

class PrismaUserMock {
  async findUnique({ where }) {
    if (where.email) return users.find(u => u.email === where.email) || null;
    if (where.id) return users.find(u => u.id === where.id) || null;
    return null;
  }
  async create({ data }) {
    // Simulate passwordHash for login
    const user = { ...data, id: (idCounter++).toString() };
    users.push(user);
    // Return full user object for JWT payloads and ownership
    return { id: user.id, email: user.email, role: user.role, passwordHash: user.passwordHash };
  }
}

class PrismaProjectMock {
  async create({ data }) {
    // Only allow owner/admin/manager
    const user = getUserById(data.ownerId);
    if (!user || !['owner', 'admin', 'manager'].includes(user.role)) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    const project = { ...data, id: (idCounter++).toString(), createdAt: new Date(), updatedAt: new Date() };
    projects.push(project);
    return project;
  }
  async findMany({ where }) {
    return projects.filter(p => p.ownerId === where.ownerId);
  }
  async update({ where, data }) {
    const project = projects.find(p => p.id === where.id);
    if (!project) throw new Error('Not found');
    const actingUser = getActingUser();
    if (!actingUser || project.ownerId !== actingUser.id || !['owner', 'admin', 'manager'].includes(actingUser.role)) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    Object.assign(project, data, { updatedAt: new Date() });
    return project;
  }
  async findUnique({ where }) {
    return projects.find(p => p.id === where.id) || null;
  }
  async delete({ where }) {
    const idx = projects.findIndex(p => p.id === where.id);
    if (idx === -1) throw new Error('Not found');
    const project = projects[idx];
    const actingUser = getActingUser();
    if (!actingUser || project.ownerId !== actingUser.id || !['owner', 'admin', 'manager'].includes(actingUser.role)) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    const [deleted] = projects.splice(idx, 1);
    return deleted;
  }
}

class PrismaWorkspaceMock {
  async create({ data }) {
    // Only allow if project exists and user is owner/admin/manager
    const project = projects.find(p => p.id === data.projectId);
    if (!project) {
      const err = new Error('Project not found');
      err.status = 400;
      throw err;
    }
    const actingUser = getActingUser();
    if (!actingUser || project.ownerId !== actingUser.id || !['owner', 'admin', 'manager'].includes(actingUser.role)) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    const workspace = { ...data, id: (idCounter++).toString(), createdAt: new Date(), updatedAt: new Date() };
    workspaces.push(workspace);
    return workspace;
  }
  async findMany({ where }) {
    return workspaces.filter(w => w.projectId === where.projectId);
  }
  async update({ where, data }) {
    const workspace = workspaces.find(w => w.id === where.id);
    if (!workspace) throw new Error('Not found');
    const project = projects.find(p => p.id === workspace.projectId);
    const actingUser = getActingUser();
    if (!actingUser || !project || project.ownerId !== actingUser.id || !['owner', 'admin', 'manager'].includes(actingUser.role)) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    Object.assign(workspace, data, { updatedAt: new Date() });
    return workspace;
  }
  async findUnique({ where }) {
    return workspaces.find(w => w.id === where.id) || null;
  }
  async delete({ where }) {
    const idx = workspaces.findIndex(w => w.id === where.id);
    if (idx === -1) throw new Error('Not found');
    const workspace = workspaces[idx];
    const project = projects.find(p => p.id === workspace.projectId);
    const actingUser = getActingUser();
    if (!actingUser || !project || project.ownerId !== actingUser.id || !['owner', 'admin', 'manager'].includes(actingUser.role)) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    const [deleted] = workspaces.splice(idx, 1);
    return deleted;
  }
}

class PrismaClientMock {
  constructor() {
    this.user = new PrismaUserMock();
    this.project = new PrismaProjectMock();
    this.workspace = new PrismaWorkspaceMock();
  }
}

// Expose helper for tests
module.exports = { PrismaClient: PrismaClientMock, __setActingUserId: setActingUserId };
