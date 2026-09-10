export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          city: string | null;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          ends_at: string | null;
          featured: boolean;
          id: string;
          location: string | null;
          registration_url: string | null;
          slug: string;
          starts_at: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          city?: string | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          featured?: boolean;
          id?: string;
          location?: string | null;
          registration_url?: string | null;
          slug: string;
          starts_at: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          city?: string | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          featured?: boolean;
          id?: string;
          location?: string | null;
          registration_url?: string | null;
          slug?: string;
          starts_at?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      external_articles: {
        Row: {
          cover_url: string | null;
          created_at: string;
          id: string;
          sort_order: number;
          source_name: string;
          status: string;
          tags: string[];
          title: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          cover_url?: string | null;
          created_at?: string;
          id?: string;
          sort_order?: number;
          source_name: string;
          status?: string;
          tags?: string[];
          title: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          cover_url?: string | null;
          created_at?: string;
          id?: string;
          sort_order?: number;
          source_name?: string;
          status?: string;
          tags?: string[];
          title?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      links: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          logo_url: string | null;
          name: string;
          sort_order: number;
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind?: string;
          logo_url?: string | null;
          name: string;
          sort_order?: number;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          logo_url?: string | null;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          created_at: string;
          href: string;
          id: string;
          label: string;
          sort_order: number;
          updated_at: string;
          visible: boolean;
        };
        Insert: {
          created_at?: string;
          href: string;
          id?: string;
          label: string;
          sort_order?: number;
          updated_at?: string;
          visible?: boolean;
        };
        Update: {
          created_at?: string;
          href?: string;
          id?: string;
          label?: string;
          sort_order?: number;
          updated_at?: string;
          visible?: boolean;
        };
        Relationships: [];
      };
      page_categories: {
        Row: {
          category_id: string;
          page_id: string;
        };
        Insert: {
          category_id: string;
          page_id: string;
        };
        Update: {
          category_id?: string;
          page_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "page_categories_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      page_tags: {
        Row: {
          page_id: string;
          tag_id: string;
        };
        Insert: {
          page_id: string;
          tag_id: string;
        };
        Update: {
          page_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_tags_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "page_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          content: string;
          cover_url: string | null;
          created_at: string;
          excerpt: string | null;
          id: string;
          slug: string;
          sort_order: number;
          status: string;
          title: string;
          updated_at: string;
          seo_title: string | null;
          seo_description: string | null;
          og_image_url: string | null;
        };
        Insert: {
          content?: string;
          cover_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          slug: string;
          sort_order?: number;
          status?: string;
          title: string;
          updated_at?: string;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
        };
        Update: {
          content?: string;
          cover_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          slug?: string;
          sort_order?: number;
          status?: string;
          title?: string;
          updated_at?: string;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
        };
        Relationships: [];
      };
      post_categories: {
        Row: {
          category_id: string;
          post_id: string;
        };
        Insert: {
          category_id: string;
          post_id: string;
        };
        Update: {
          category_id?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_categories_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_tags: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          author_id: string | null;
          category: string;
          content: string;
          cover_url: string | null;
          created_at: string;
          excerpt: string | null;
          id: string;
          published_at: string | null;
          slug: string;
          status: string;
          title: string;
          updated_at: string;
          seo_title: string | null;
          seo_description: string | null;
          og_image_url: string | null;
        };
        Insert: {
          author_id?: string | null;
          category?: string;
          content?: string;
          cover_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          published_at?: string | null;
          slug: string;
          status?: string;
          title: string;
          updated_at?: string;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
        };
        Update: {
          author_id?: string | null;
          category?: string;
          content?: string;
          cover_url?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          published_at?: string | null;
          slug?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image_url?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      hit_rate_limit: {
        Args: { _key: string; _max: number; _window_seconds: number };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "editor" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "user"],
    },
  },
} as const;
