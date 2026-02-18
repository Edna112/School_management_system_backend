import express from "express";
import { or, ilike, and, sql, eq, desc, getTableColumns } from "drizzle-orm";
import { db } from "../db";
import { user } from "../db/schema";

const router = express.Router();

//get all users with optional search, filtering and pagination.
router.get("/", async (req, res) => {
    try {
        const { search, role, page = "1", limit = "10" } = req.query;
        const pageNum = Number(Array.isArray(page) ? page[0] : page);
        const limitNum = Number(Array.isArray(limit) ? limit[0] : limit);

        const currentPage = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1;
        const limitPage = Number.isFinite(limitNum) && limitNum > 0 ? Math.floor(limitNum) : 10;

        const offset = (currentPage - 1) * limitPage;

        const filterConditions = [];

        //if a search query exist, filter it by user name OR user email
        if (search) {
            const searchPattern = `%${String(search).replace(/[%_]/g, "\\$&")}%`;
            filterConditions.push(
                or(
                    ilike(user.name, searchPattern),
                    ilike(user.email, searchPattern)
                )
            );
        }

        //if a role is selected, filter it by exact role match
        const validRoles = ["student", "teacher", "admin"] as const;
        if (role && validRoles.includes(String(role) as typeof validRoles[number])) {
            filterConditions.push(eq(user.role, String(role) as typeof validRoles[number]));
        }

        //combine all filters if they exist using the AND operator
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(user)
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const usersList = await db
            .select(getTableColumns(user))
            .from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPage)
            .offset(offset);

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPage),
            },
        });
    } catch (e) {
        console.error(`Get/users error: ${e}`);
        res.status(500).json({ error: "Failed to get users" });
    }
});

export default router;
