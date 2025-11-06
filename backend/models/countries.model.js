export default async function defineCountryModel(sequelize, DataTypes) {
    const Country = sequelize.define('Country', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        flag_emoji:{
            type: DataTypes.STRING,
            allowNull: true
        }
    });

    return Country;
}