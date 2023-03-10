const { User, Project, Team, Task } = require("../models");
const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");
const bcrypt = require("bcrypt");

const resolvers = {
  Query: {
    users: async () => {
      return await User.find({});
    },
    projects: async () => {
      return await Project.find({});
    },
    teams: async () => {
      return await Team.find({});
    },
    tasks: async () => {
      return await Task.find({});
    },
    getUser: async (parent, { userId }) => {
      return User.findById(userId);
    },
    getProject: async (parent, { projectId }) => {
      return await Project.findById(projectId)
        .populate("teams")
        .populate({ path: "teams", populate: "users" });
    },
    getTeam: async (parent, { teamId }) => {
      return await Team.findById(teamId).populate("project").populate("users");
    },
    getTask: async (parent, { taskId }) => {
      return await Task.findById(taskId);
    },
  },

  Mutation: {
    createUser: async (
      parent,
      { username, password, email, firstname, lastname, position, team }
    ) => {
      const newUser = await User.create({
        username,
        password: password,
        email,
        firstname,
        lastname,
        position,
        team,
      });
      const updateTeam = await Team.findOneAndUpdate(
        { _id: newUser.team },
        { $addToSet: { users: newUser._id } }
      );
      return newUser;
    },
    createProject: async (
      parent,
      { projectName, description, teams, endDate }
    ) => {
      const newProject = await Project.create({
        projectName,
        description,
        teams,
        endDate,
      });
      console.log(newProject);
      const updateTeam = await Team.findOneAndUpdate(
        { _id: newProject.teams },
        { $addToSet: { project: newProject._id } }
      );
      return newProject;
    },
    createTeam: async (parent, { users, project }) => {
      return await Team.create({ users, project });
    },
    createTask: async (parent, { taskname, userId, projectId }) => {
      return await Task.create({ taskname, userId, projectId });
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError("No user found");
      }

      console.log(user.password);

      console.log(password);
      const correctPW = await user.isCorrectPassword(password);
      console.log(correctPW);
      if (!correctPW) {
        throw new AuthenticationError("Incorrect name or password.");
      }
      const token = signToken(user);
      return { token, user };
    },
    deleteUser: async (parent, { _id }) => {
      return await User.findOneAndDelete({ _id });
    },
    deleteProject: async (parent, { _id }) => {
      return Project.findOneAndDelete({ _id });
    },
    deleteTeam: async (parent, { _id }) => {
      return Team.findOneAndDelete({ _id });
    },
    // TODO: deleteTask
  },
};

module.exports = resolvers;
