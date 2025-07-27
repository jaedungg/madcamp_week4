-- CreateTable
CREATE TABLE "document_access_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "accessed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "time_spent" INTEGER DEFAULT 0,

    CONSTRAINT "document_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_shares" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "share_id" VARCHAR(255) NOT NULL,
    "share_type" VARCHAR(20) DEFAULT 'private',
    "permissions" VARCHAR(20) DEFAULT 'read',
    "password_hash" VARCHAR(255),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "document_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "excerpt" TEXT,
    "word_count" INTEGER DEFAULT 0,
    "category" VARCHAR(50) NOT NULL,
    "tags" TEXT[],
    "status" VARCHAR(20) DEFAULT 'draft',
    "is_favorite" BOOLEAN DEFAULT false,
    "ai_requests_used" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "last_modified_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "search_vector" tsvector DEFAULT to_tsvector('english'::regconfig, (((COALESCE(title, ''::character varying))::text || ' '::text) || COALESCE(content, ''::text))),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profile_image" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_access_logs_accessed_at" ON "document_access_logs"("accessed_at");

-- CreateIndex
CREATE INDEX "idx_access_logs_document_id" ON "document_access_logs"("document_id");

-- CreateIndex
CREATE INDEX "idx_access_logs_user_id" ON "document_access_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_shares_share_id_key" ON "document_shares"("share_id");

-- CreateIndex
CREATE INDEX "idx_document_shares_document_id" ON "document_shares"("document_id");

-- CreateIndex
CREATE INDEX "idx_document_shares_owner_id" ON "document_shares"("owner_id");

-- CreateIndex
CREATE INDEX "idx_document_shares_share_id" ON "document_shares"("share_id");

-- CreateIndex
CREATE INDEX "idx_documents_category" ON "documents"("category");

-- CreateIndex
CREATE INDEX "idx_documents_created_at" ON "documents"("created_at");

-- CreateIndex
CREATE INDEX "idx_documents_search" ON "documents" USING GIN ("search_vector");

-- CreateIndex
CREATE INDEX "idx_documents_status" ON "documents"("status");

-- CreateIndex
CREATE INDEX "idx_documents_updated_at" ON "documents"("updated_at");

-- CreateIndex
CREATE INDEX "idx_documents_user_id" ON "documents"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
