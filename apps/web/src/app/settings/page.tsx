'use client'

import { useState } from 'react'
import { Settings, User, Bell, Shield, Calendar, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Settings components
import { MissionPreferences } from '@/components/settings/mission-preferences'
import { MissionAdaptation } from '@/components/settings/mission-adaptation'
import { PerformancePrivacySettings } from '@/components/settings/performance-privacy-settings'
import { BehavioralPrivacySettings } from '@/components/settings/behavioral-privacy-settings'
import { CalendarIntegrationSettings } from '@/components/settings/calendar-integration-settings'
import { PersonalizationSettings } from '@/components/settings/personalization-settings'

export default function NewSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <Settings className="w-10 h-10 text-primary" />
            <div>
                <h1 className="text-4xl font-heading font-bold">Settings</h1>
                <p className="text-lg text-muted-foreground">Manage your preferences and personalize your experience.</p>
            </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex flex-col md:flex-row gap-6">
        <TabsList className="flex flex-col h-auto p-2 bg-card rounded-xl">
          <TabsTrigger value="general" className="text-lg font-semibold rounded-xl flex items-center gap-3 py-3 px-4"><User className="w-6 h-6" /> General</TabsTrigger>
          <TabsTrigger value="mission" className="text-lg font-semibold rounded-xl flex items-center gap-3 py-3 px-4"><Bell className="w-6 h-6" /> Mission</TabsTrigger>
          <TabsTrigger value="privacy" className="text-lg font-semibold rounded-xl flex items-center gap-3 py-3 px-4"><Shield className="w-6 h-6" /> Privacy</TabsTrigger>
          <TabsTrigger value="integrations" className="text-lg font-semibold rounded-xl flex items-center gap-3 py-3 px-4"><Calendar className="w-6 h-6" /> Integrations</TabsTrigger>
          <TabsTrigger value="personalization" className="text-lg font-semibold rounded-xl flex items-center gap-3 py-3 px-4"><Palette className="w-6 h-6" /> Personalization</TabsTrigger>
        </TabsList>

        <div className="flex-1 space-y-6">
            <TabsContent value="general">
                <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl h-96 flex justify-center items-center">
                    <p className="text-lg font-semibold text-muted-foreground">General Settings Placeholder</p>
                </Card>
            </TabsContent>
            <TabsContent value="mission">
                <MissionPreferences />
                <MissionAdaptation />
            </TabsContent>
            <TabsContent value="privacy">
                <PerformancePrivacySettings />
                <BehavioralPrivacySettings />
            </TabsContent>
            <TabsContent value="integrations">
                <CalendarIntegrationSettings />
            </TabsContent>
            <TabsContent value="personalization">
                <PersonalizationSettings />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
