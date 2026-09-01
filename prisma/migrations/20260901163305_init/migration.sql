-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'citizen',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "severity" INTEGER,
    "urgency" TEXT,
    "durationDays" INTEGER,
    "latitude" REAL,
    "longitude" REAL,
    "address" TEXT,
    "imageUrl" TEXT,
    "aiSummary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Complaint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplaintCluster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "probableRootCause" TEXT,
    "rootCauseConfidence" INTEGER,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "severityScore" INTEGER NOT NULL DEFAULT 0,
    "impactScore" INTEGER NOT NULL DEFAULT 0,
    "frequencyScore" INTEGER NOT NULL DEFAULT 0,
    "durationScore" INTEGER NOT NULL DEFAULT 0,
    "estimatedAffectedPeople" INTEGER NOT NULL DEFAULT 0,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "radius" REAL NOT NULL DEFAULT 1.0,
    "recommendedAction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'investigating',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ClusterComplaint" (
    "clusterId" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("clusterId", "complaintId"),
    CONSTRAINT "ClusterComplaint_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "ComplaintCluster" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClusterComplaint_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
