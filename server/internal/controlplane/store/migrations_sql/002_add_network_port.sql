-- Migration: 002_add_network_port.sql
-- Purpose: Add support for multi-network isolation by tracking Listen Port and Interface Name

-- Add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='networks' AND column_name='listen_port') THEN
        ALTER TABLE networks ADD COLUMN listen_port INTEGER DEFAULT 51820;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='networks' AND column_name='interface_name') THEN
        ALTER TABLE networks ADD COLUMN interface_name VARCHAR(50) DEFAULT 'wg0';
    END IF;
END $$;

-- Enforce uniqueness to prevent port conflicts
ALTER TABLE networks DROP CONSTRAINT IF EXISTS networks_listen_port_key;
ALTER TABLE networks ADD CONSTRAINT networks_listen_port_key UNIQUE (listen_port);

ALTER TABLE networks DROP CONSTRAINT IF EXISTS networks_interface_name_key;
ALTER TABLE networks ADD CONSTRAINT networks_interface_name_key UNIQUE (interface_name);
