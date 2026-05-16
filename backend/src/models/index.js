const sequelize = require('../config/database');
const Role = require('./Role');
const User = require('./User');
const Category = require('./Category');
const Tag = require('./Tag');
const Article = require('./Article');
const ArticleTag = require('./ArticleTag');
const Attachment = require('./Attachment');
const Comment = require('./Comment');
const Rating = require('./Rating');
const Bookmark = require('./Bookmark');

// Role <-> User
Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// Category <-> Article
Category.hasMany(Article, { foreignKey: 'categoryId' });
Article.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Category self-referential (parent/children)
Category.hasMany(Category, { foreignKey: 'parentId', as: 'subCategories' });
Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });

// User (author) <-> Article
User.hasMany(Article, { foreignKey: 'authorId', as: 'articles' });
Article.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// User (reviewer) <-> Article
User.hasMany(Article, { foreignKey: 'reviewerId', as: 'reviewedArticles' });
Article.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

// Article <-> Tag (many-to-many through ArticleTag)
Article.belongsToMany(Tag, { through: ArticleTag, foreignKey: 'articleId', as: 'tags' });
Tag.belongsToMany(Article, { through: ArticleTag, foreignKey: 'tagId', as: 'articles' });

// Article <-> Attachment
Article.hasMany(Attachment, { foreignKey: 'articleId', as: 'attachments' });
Attachment.belongsTo(Article, { foreignKey: 'articleId' });

// Article <-> Comment
Article.hasMany(Comment, { foreignKey: 'articleId', as: 'comments' });
Comment.belongsTo(Article, { foreignKey: 'articleId' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Article <-> Rating
Article.hasMany(Rating, { foreignKey: 'articleId', as: 'ratings' });
Rating.belongsTo(Article, { foreignKey: 'articleId' });
Rating.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Article <-> Bookmark
Article.hasMany(Bookmark, { foreignKey: 'articleId', as: 'bookmarks' });
Bookmark.belongsTo(Article, { foreignKey: 'articleId' });
Bookmark.belongsTo(User, { foreignKey: 'userId' });

// User <-> Bookmark / Comment
User.hasMany(Bookmark, { foreignKey: 'userId' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });

module.exports = {
  sequelize,
  Role,
  User,
  Category,
  Tag,
  Article,
  ArticleTag,
  Attachment,
  Comment,
  Rating,
  Bookmark,
};
