/**
 * @fileoverview
 * TeamPage model — stores the public page layout and settings for a team.
 *
 * Each team has exactly one page (1:1 with Team).
 * The `layout` field is a JSON array of module descriptors:
 *
 * layout: [
 *   {
 *     id: "uuid",          // unique per module instance
 *     type: "hero",        // module type key
 *     col: 0,              // grid column (0-based, out of 12)
 *     row: 0,              // grid row (0-based)
 *     w: 12,               // width in columns (1-12)
 *     h: 1,                // height in rows
 *     config: {}           // module-specific configuration
 *   }
 * ]
 */

export default function defineTeamPageModel(sequelize, DataTypes) {
    const TeamPage = sequelize.define('TeamPage', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        team_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'Team',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        },
        layout: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: []
        },
        theme: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'default'
        },
        custom_css: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        hero_image_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        accent_color: {
            type: DataTypes.STRING(7),
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'TeamPage',
        timestamps: false
    });

    TeamPage.associate = (models) => {
        TeamPage.belongsTo(models.Team, {
            foreignKey: 'team_id',
            as: 'team'
        });
    };

    return TeamPage;
}
