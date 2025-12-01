const generateSlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

const generateUniqueSlug = async (pool, tableName, text, excludeId = null) => {
    let slug = generateSlug(text);
    let counter = 0;
    let uniqueSlug = slug;
    
    while (true) {
        let query = `SELECT id FROM ${tableName} WHERE slug = ?`;
        const params = [uniqueSlug];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        
        if (rows.length === 0) break;
        
        counter++;
        uniqueSlug = `${slug}-${counter}`;
    }
    
    return uniqueSlug;
};

module.exports = { generateSlug, generateUniqueSlug };
