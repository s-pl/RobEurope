export default async function defineSponsorsModel(sequelize, DataTypes) {  
    const Sponsor = sequelize.define('Sponsor', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        logo_url: {
            type: DataTypes.STRING,
            allowNull: true
        },
        website_url: {
            type: DataTypes.STRING,
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
    });

    return Sponsor;
}