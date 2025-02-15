import type { Meta, StoryObj } from '@storybook/react'

import PublicLayout from '@/components/Layout/PublicLayout'
import { QueryClientProvider, queryClient } from 'polarkit/api'
import Pledge from '../components/Pledge/Pledge'
import { issue } from './testdata'

const meta: Meta<typeof Pledge> = {
  title: 'Pages/Pledge',
  component: Pledge,
  args: {
    issue: issue,
  },
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
}

export default meta

type Story = StoryObj<typeof Pledge>

export const Default: Story = {
  parameters: {
    chromatic: { viewports: [390, 1200] },
  },

  render: (args) => {
    return (
      <QueryClientProvider client={queryClient}>
        <PublicLayout>
          <Pledge {...args} />
        </PublicLayout>
      </QueryClientProvider>
    )
  },
}

export const NoNameDescription: Story = {
  ...Default,
  args: {
    ...Default.args,
    issue: {
      ...issue,
      repository: {
        ...issue.repository,
        description: undefined,
        organization: {
          ...issue.repository.organization,
          pretty_name: undefined,
        },
      },
    },
  },
}

export const FundingGoal: Story = {
  ...Default,
  args: {
    ...Default.args,
    issue: {
      ...issue,
      funding: {
        funding_goal: { currency: 'USD', amount: 15000 },
        pledges_sum: { currency: 'USD', amount: 5000 },
      },
    },
  },
}
