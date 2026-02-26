import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminGetUserCommand, AdminUpdateUserAttributesCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, ListUsersInGroupCommand, CreateGroupCommand, GetGroupCommand, AdminListGroupsForUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

const USER_POOL_ID = process.env.USER_POOL_ID!;
const USER_PROFILES_TABLE = process.env.USER_PROFILES_TABLE!;
const PERMISSIONS_TABLE = process.env.PERMISSIONS_TABLE || USER_PROFILES_TABLE;

// Role definitions for RBAC
enum UserRole {
  STUDENT = 'student',
  PREMIUM_STUDENT = 'premium_student',
  EDUCATOR = 'educator',
  ADMIN = 'admin'
}

// Permission definitions
enum Permission {
  READ_OWN_DATA = 'read:own_data',
  WRITE_OWN_DATA = 'write:own_data',
  DELETE_OWN_DATA = 'delete:own_data',
  UPLOAD_DOCUMENTS = 'upload:documents',
  SHARE_DOCUMENTS = 'share:documents',
  ACCESS_AI_FEATURES = 'access:ai_features',
  ACCESS_PREMIUM_FEATURES = 'access:premium_features',
  MANAGE_USERS = 'manage:users',
  VIEW_ANALYTICS = 'view:analytics'
}

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.STUDENT]: [
    Permission.READ_OWN_DATA,
    Permission.WRITE_OWN_DATA,
    Permission.DELETE_OWN_DATA,
    Permission.UPLOAD_DOCUMENTS,
    Permission.ACCESS_AI_FEATURES
  ],
  [UserRole.PREMIUM_STUDENT]: [
    Permission.READ_OWN_DATA,
    Permission.WRITE_OWN_DATA,
    Permission.DELETE_OWN_DATA,
    Permission.UPLOAD_DOCUMENTS,
    Permission.SHARE_DOCUMENTS,
    Permission.ACCESS_AI_FEATURES,
    Permission.ACCESS_PREMIUM_FEATURES
  ],
  [UserRole.EDUCATOR]: [
    Permission.READ_OWN_DATA,
    Permission.WRITE_OWN_DATA,
    Permission.DELETE_OWN_DATA,
    Permission.UPLOAD_DOCUMENTS,
    Permission.SHARE_DOCUMENTS,
    Permission.ACCESS_AI_FEATURES,
    Permission.ACCESS_PREMIUM_FEATURES,
    Permission.VIEW_ANALYTICS
  ],
  [UserRole.ADMIN]: [
    Permission.READ_OWN_DATA,
    Permission.WRITE_OWN_DATA,
    Permission.DELETE_OWN_DATA,
    Permission.UPLOAD_DOCUMENTS,
    Permission.SHARE_DOCUMENTS,
    Permission.ACCESS_AI_FEATURES,
    Permission.ACCESS_PREMIUM_FEATURES,
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS
  ]
};

interface AuthRequest {
  action: 'check-permission' | 'assign-role' | 'remove-role' | 'get-user-roles' | 'share-document' | 'revoke-share' | 'list-shared-documents' | 'initialize-groups';
  userId?: string;
  targetUserId?: string;
  role?: UserRole;
  permission?: Permission;
  documentId?: string;
  shareWithUserId?: string;
  sharePermissions?: string[];
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  hasPermission?: boolean;
  roles?: UserRole[];
  permissions?: Permission[];
}

interface DocumentShare {
  documentId: string;
  ownerId: string;
  sharedWithUserId: string;
  permissions: string[];
  sharedAt: number;
  expiresAt?: number;
}

/**
 * Lambda handler for authentication and authorization operations
 * Requirements: 9.3 (authentication), 9.5 (data sharing permissions)
 */
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log('Auth manager request received:', JSON.stringify(event));

    // Parse request body
    const body: AuthRequest = JSON.parse(event.body || '{}');
    
    // Extract userId from authorizer context
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    if (!userId) {
      return createErrorResponse(401, 'Unauthorized: User ID not found');
    }

    // Route to appropriate handler based on action
    let response: AuthResponse;
    
    switch (body.action) {
      case 'check-permission':
        response = await handleCheckPermission(userId, body.permission!);
        break;
      
      case 'assign-role':
        response = await handleAssignRole(userId, body.targetUserId || userId, body.role!);
        break;
      
      case 'remove-role':
        response = await handleRemoveRole(userId, body.targetUserId || userId, body.role!);
        break;
      
      case 'get-user-roles':
        response = await handleGetUserRoles(body.targetUserId || userId);
        break;
      
      case 'share-document':
        response = await handleShareDocument(userId, body.documentId!, body.shareWithUserId!, body.sharePermissions || ['read']);
        break;
      
      case 'revoke-share':
        response = await handleRevokeShare(userId, body.documentId!, body.shareWithUserId!);
        break;
      
      case 'list-shared-documents':
        response = await handleListSharedDocuments(userId);
        break;
      
      case 'initialize-groups':
        response = await handleInitializeGroups();
        break;
      
      default:
        return createErrorResponse(400, `Unknown action: ${body.action}`);
    }

    return createSuccessResponse(response);
  } catch (error) {
    console.error('Auth manager error:', error);
    return createErrorResponse(500, 'Internal server error during authentication operation');
  }
};

/**
 * Check if user has specific permission
 * Requirement 9.3: Role-based access control
 */
async function handleCheckPermission(userId: string, permission: Permission): Promise<AuthResponse> {
  try {
    const roles = await getUserRoles(userId);
    const permissions = getRolePermissions(roles);
    const hasPermission = permissions.includes(permission);

    return {
      success: true,
      message: hasPermission ? 'Permission granted' : 'Permission denied',
      hasPermission,
      roles,
      permissions
    };
  } catch (error) {
    console.error('Check permission error:', error);
    throw new Error('Failed to check permission');
  }
}

/**
 * Assign role to user
 * Requirement 9.3: Role-based access control
 */
async function handleAssignRole(requesterId: string, targetUserId: string, role: UserRole): Promise<AuthResponse> {
  try {
    // Check if requester has permission to manage users
    const requesterRoles = await getUserRoles(requesterId);
    const requesterPermissions = getRolePermissions(requesterRoles);
    
    if (!requesterPermissions.includes(Permission.MANAGE_USERS) && requesterId !== targetUserId) {
      return {
        success: false,
        message: 'Insufficient permissions to assign roles to other users'
      };
    }

    // Add user to Cognito group
    try {
      await cognitoClient.send(new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: targetUserId,
        GroupName: role
      }));
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        // Group doesn't exist, create it
        await createCognitoGroup(role);
        // Retry adding user to group
        await cognitoClient.send(new AdminAddUserToGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: targetUserId,
          GroupName: role
        }));
      } else {
        throw error;
      }
    }

    // Update user profile in DynamoDB
    await updateUserRole(targetUserId, role, 'add');

    return {
      success: true,
      message: `Role ${role} assigned successfully to user ${targetUserId}`,
      data: {
        userId: targetUserId,
        role,
        permissions: ROLE_PERMISSIONS[role]
      }
    };
  } catch (error) {
    console.error('Assign role error:', error);
    throw new Error('Failed to assign role');
  }
}

/**
 * Remove role from user
 * Requirement 9.3: Role-based access control
 */
async function handleRemoveRole(requesterId: string, targetUserId: string, role: UserRole): Promise<AuthResponse> {
  try {
    // Check if requester has permission to manage users
    const requesterRoles = await getUserRoles(requesterId);
    const requesterPermissions = getRolePermissions(requesterRoles);
    
    if (!requesterPermissions.includes(Permission.MANAGE_USERS) && requesterId !== targetUserId) {
      return {
        success: false,
        message: 'Insufficient permissions to remove roles from other users'
      };
    }

    // Remove user from Cognito group
    await cognitoClient.send(new AdminRemoveUserFromGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: targetUserId,
      GroupName: role
    }));

    // Update user profile in DynamoDB
    await updateUserRole(targetUserId, role, 'remove');

    return {
      success: true,
      message: `Role ${role} removed successfully from user ${targetUserId}`,
      data: {
        userId: targetUserId,
        role
      }
    };
  } catch (error) {
    console.error('Remove role error:', error);
    throw new Error('Failed to remove role');
  }
}

/**
 * Get user roles
 * Requirement 9.3: Role-based access control
 */
async function handleGetUserRoles(userId: string): Promise<AuthResponse> {
  try {
    const roles = await getUserRoles(userId);
    const permissions = getRolePermissions(roles);

    return {
      success: true,
      message: 'User roles retrieved successfully',
      roles,
      permissions,
      data: {
        userId,
        roles,
        permissions
      }
    };
  } catch (error) {
    console.error('Get user roles error:', error);
    throw new Error('Failed to get user roles');
  }
}

/**
 * Share document with another user
 * Requirement 9.5: Data sharing permission management
 */
async function handleShareDocument(
  ownerId: string,
  documentId: string,
  shareWithUserId: string,
  permissions: string[]
): Promise<AuthResponse> {
  try {
    // Verify owner has permission to share
    const ownerRoles = await getUserRoles(ownerId);
    const ownerPermissions = getRolePermissions(ownerRoles);
    
    if (!ownerPermissions.includes(Permission.SHARE_DOCUMENTS)) {
      return {
        success: false,
        message: 'You do not have permission to share documents'
      };
    }

    // Create share record
    const share: DocumentShare = {
      documentId,
      ownerId,
      sharedWithUserId: shareWithUserId,
      permissions,
      sharedAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };

    // Store share in DynamoDB
    await dynamoClient.send(new PutItemCommand({
      TableName: PERMISSIONS_TABLE,
      Item: {
        pk: { S: `SHARE#${documentId}` },
        sk: { S: `USER#${shareWithUserId}` },
        documentId: { S: documentId },
        ownerId: { S: ownerId },
        sharedWithUserId: { S: shareWithUserId },
        permissions: { SS: permissions },
        sharedAt: { N: share.sharedAt.toString() },
        expiresAt: { N: share.expiresAt!.toString() },
        ttl: { N: Math.floor(share.expiresAt! / 1000).toString() }
      }
    }));

    return {
      success: true,
      message: 'Document shared successfully',
      data: share
    };
  } catch (error) {
    console.error('Share document error:', error);
    throw new Error('Failed to share document');
  }
}

/**
 * Revoke document share
 * Requirement 9.5: Data sharing permission management
 */
async function handleRevokeShare(
  ownerId: string,
  documentId: string,
  shareWithUserId: string
): Promise<AuthResponse> {
  try {
    // Delete share record
    await dynamoClient.send(new UpdateItemCommand({
      TableName: PERMISSIONS_TABLE,
      Key: {
        pk: { S: `SHARE#${documentId}` },
        sk: { S: `USER#${shareWithUserId}` }
      },
      UpdateExpression: 'SET #status = :revoked, revokedAt = :timestamp',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':revoked': { S: 'revoked' },
        ':timestamp': { N: Date.now().toString() }
      }
    }));

    return {
      success: true,
      message: 'Document share revoked successfully',
      data: {
        documentId,
        sharedWithUserId,
        revokedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Revoke share error:', error);
    throw new Error('Failed to revoke share');
  }
}

/**
 * List documents shared with user
 * Requirement 9.5: Data sharing permission management
 */
async function handleListSharedDocuments(userId: string): Promise<AuthResponse> {
  try {
    // Query shares where user is the recipient
    const response = await dynamoClient.send(new QueryCommand({
      TableName: PERMISSIONS_TABLE,
      IndexName: 'SharedWithUserIndex',
      KeyConditionExpression: 'sharedWithUserId = :userId',
      FilterExpression: '#status <> :revoked',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':userId': { S: userId },
        ':revoked': { S: 'revoked' }
      }
    }));

    const sharedDocuments = response.Items?.map(item => ({
      documentId: item.documentId.S,
      ownerId: item.ownerId.S,
      permissions: item.permissions.SS,
      sharedAt: new Date(parseInt(item.sharedAt.N!)).toISOString(),
      expiresAt: item.expiresAt?.N ? new Date(parseInt(item.expiresAt.N)).toISOString() : undefined
    })) || [];

    return {
      success: true,
      message: 'Shared documents retrieved successfully',
      data: {
        userId,
        sharedDocuments,
        count: sharedDocuments.length
      }
    };
  } catch (error) {
    console.error('List shared documents error:', error);
    throw new Error('Failed to list shared documents');
  }
}

/**
 * Initialize Cognito groups for RBAC
 */
async function handleInitializeGroups(): Promise<AuthResponse> {
  try {
    const groups = Object.values(UserRole);
    const createdGroups: string[] = [];

    for (const group of groups) {
      try {
        await createCognitoGroup(group);
        createdGroups.push(group);
      } catch (error: any) {
        if (error.name !== 'GroupExistsException') {
          console.error(`Failed to create group ${group}:`, error);
        }
      }
    }

    return {
      success: true,
      message: 'Groups initialized successfully',
      data: {
        createdGroups,
        allGroups: groups
      }
    };
  } catch (error) {
    console.error('Initialize groups error:', error);
    throw new Error('Failed to initialize groups');
  }
}

// Helper functions

async function getUserRoles(userId: string): Promise<UserRole[]> {
  try {
    const response = await cognitoClient.send(new AdminListGroupsForUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId
    }));

    const roles = response.Groups?.map(group => group.GroupName as UserRole) || [];
    
    // If user has no roles, assign default student role
    if (roles.length === 0) {
      return [UserRole.STUDENT];
    }

    return roles;
  } catch (error) {
    console.error('Get user roles error:', error);
    // Return default role on error
    return [UserRole.STUDENT];
  }
}

function getRolePermissions(roles: UserRole[]): Permission[] {
  const permissions = new Set<Permission>();
  
  for (const role of roles) {
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    rolePerms.forEach(perm => permissions.add(perm));
  }

  return Array.from(permissions);
}

async function createCognitoGroup(groupName: string): Promise<void> {
  await cognitoClient.send(new CreateGroupCommand({
    UserPoolId: USER_POOL_ID,
    GroupName: groupName,
    Description: `${groupName} role for Voice Learning Assistant`
  }));
}

async function updateUserRole(userId: string, role: UserRole, action: 'add' | 'remove'): Promise<void> {
  try {
    // Get current user profile
    const response = await dynamoClient.send(new GetItemCommand({
      TableName: USER_PROFILES_TABLE,
      Key: {
        userId: { S: userId }
      }
    }));

    const currentRoles = response.Item?.roles?.SS || [];
    
    let updatedRoles: string[];
    if (action === 'add') {
      updatedRoles = [...new Set([...currentRoles, role])];
    } else {
      updatedRoles = currentRoles.filter(r => r !== role);
    }

    // Update user profile
    await dynamoClient.send(new UpdateItemCommand({
      TableName: USER_PROFILES_TABLE,
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: 'SET roles = :roles, lastUpdated = :timestamp',
      ExpressionAttributeValues: {
        ':roles': { SS: updatedRoles.length > 0 ? updatedRoles : [UserRole.STUDENT] },
        ':timestamp': { N: Date.now().toString() }
      }
    }));
  } catch (error) {
    console.error('Update user role error:', error);
    // Non-critical error, log and continue
  }
}

/**
 * Create success response
 */
function createSuccessResponse(data: AuthResponse): APIGatewayProxyResultV2 {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(data)
  };
}

/**
 * Create error response
 */
function createErrorResponse(statusCode: number, message: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ error: message })
  };
}
