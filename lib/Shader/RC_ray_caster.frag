//
//  RC_ray_caster.frag
//
//
//  Created by Kun Zhao on 2014-11-11 12:32:27.
//
//

#version 120
struct ShadingParameter
{
    float Ka; // ambient
    float Kd; // diffuse
    float Ks; // specular
    float S;  // shininess
};

vec3 ShadingNone( in ShadingParameter shading, in vec3 color )
{
    return( color );
}

vec3 ShadingLambert( in ShadingParameter shading, in vec3 color, in vec3 L, in vec3 N )
{
#if defined( ENABLE_TWO_SIDE_LIGHTING )
    float dd = abs( dot( N, L ) );
#else
    float dd = max( dot( N, L ), 0.0 );
#endif

    float Ia = shading.Ka;
    float Id = shading.Kd * dd;

    return( color * ( Ia + Id ) );
}

vec3 ShadingPhong( in ShadingParameter shading, in vec3 color, in vec3 L, in vec3 N, in vec3 V )
{
    vec3 R = reflect( -L, N );
#if defined( ENABLE_TWO_SIDE_LIGHTING )
    float dd = abs( dot( N, L ) );
    float ds = pow( abs( dot( R, V ) ), shading.S );
#else
    float dd = max( dot( N, L ), 0.0 );
    float ds = pow( max( dot( R, V ), 0.0 ), shading.S );
#endif
    if ( dd <= 0.0 ) ds = 0.0;

    float Ia = shading.Ka;
    float Id = shading.Kd * dd;
    float Is = shading.Ks * ds;

    return( color * ( Ia + Id ) + Is );
}

vec3 ShadingBlinnPhong( in ShadingParameter shading, in vec3 color, in vec3 L, in vec3 N, in vec3 V )
{
    vec3 H = normalize( L + V );
#if defined( ENABLE_TWO_SIDE_LIGHTING )
    float dd = abs( dot( N, L ) );
    float ds = pow( abs( dot( H, N ) ), shading.S );
#else
    float dd = max( dot( N, L ), 0.0 );
    float ds = pow( max( dot( H, N ), 0.0 ), shading.S );
#endif
    if ( dd <= 0.0 ) ds = 0.0;

    float Ia = shading.Ka;
    float Id = shading.Kd * dd;
    float Is = shading.Ks * ds;

    return( color * ( Ia + Id ) + Is );
}

struct VolumeParameter
{
    vec3 resolution; // volume resolution
    vec3 resolution_ratio; // ratio of the resolution (256x256x128 => 1:1:0.5)
    vec3 resolution_reciprocal; // reciprocal number of the resolution
    float min_range; // min. range of the value
    float max_range; // max. range of the value
};

/*===========================================================================*/
/**
 *  @brief  Returns gradient vector estimated from six adjacent scalars.
 *  @param  v [in] volume data
 *  @param  p [in] sampling point
 *  @param  o [in] offset
 *  @return gradient vector
 */
/*===========================================================================*/
vec3 VolumeGradient( in sampler3D v, in vec3 p, in vec3 o )
{
    float s0 = texture3D( v, p + vec3( o.x, 0.0, 0.0 ) ).w;
    float s1 = texture3D( v, p + vec3( 0.0, o.y, 0.0 ) ).w;
    float s2 = texture3D( v, p + vec3( 0.0, 0.0, o.z ) ).w;
    float s3 = texture3D( v, p - vec3( o.x, 0.0, 0.0 ) ).w;
    float s4 = texture3D( v, p - vec3( 0.0, o.y, 0.0 ) ).w;
    float s5 = texture3D( v, p - vec3( 0.0, 0.0, o.z ) ).w;

    return vec3( s3 - s0, s4 - s1, s5 - s2 );
}

/*===========================================================================*/
/**
 *  @brief  Returns gradient vector estimated from eight adjacent scalars.
 *  @param  v [in] volume data
 *  @param  p [in] sampling point
 *  @param  o [in] offset
 *  @return gradient vector
 */
/*===========================================================================*/
vec3 VolumeGradient8( in sampler3D v, in vec3 p, in vec3 o )
{
    vec3 g0 = VolumeGradient( v, p, o );
    vec3 g1 = VolumeGradient( v, p + vec3( -o.x, -o.y, -o.z ), o );
    vec3 g2 = VolumeGradient( v, p + vec3(  o.x,  o.y,  o.z ), o );
    vec3 g3 = VolumeGradient( v, p + vec3( -o.x,  o.y, -o.z ), o );
    vec3 g4 = VolumeGradient( v, p + vec3(  o.x, -o.y,  o.z ), o );
    vec3 g5 = VolumeGradient( v, p + vec3( -o.x, -o.y,  o.z ), o );
    vec3 g6 = VolumeGradient( v, p + vec3(  o.x,  o.y, -o.z ), o );
    vec3 g7 = VolumeGradient( v, p + vec3( -o.x,  o.y,  o.z ), o );
    vec3 g8 = VolumeGradient( v, p + vec3(  o.x, -o.y, -o.z ), o );
    vec3 mix0 = mix( mix( g1, g2, 0.5 ), mix( g3, g4, 0.5 ), 0.5 );
    vec3 mix1 = mix( mix( g5, g6, 0.5 ), mix( g7, g8, 0.5 ), 0.5 );

    return mix( g0, mix( mix0, mix1, 0.5 ), 0.75 );
}

struct TransferFunctionParameter
{
    float min_value; // min. scalar value
    float max_value; // max. scalar value
};

#if __VERSION__ >= 130
#define VertIn in
#define VertOut out
#define GeomIn in
#define GeomOut out
#define FragIn in
#else
#define VertIn attribute
#define VertOut varying
#define GeomIn varying in
#define GeomOut varying out
#define FragIn varying
#endif

// Interpolation qualifiers.
#if __VERSION__ >= 130
#define VertOutWithFlat flat VertOut
#define VertOutWithSmooth smooth VertOut
#define VertOutWithNoperspective noperspective VertOut
#define GeomInWithFlat flat GeomIn
#define GeomInWithSmooth smooth GeomIn
#define GeomInWithNoperspective noperspective GeomIn
#define GeomOutWithFlat flat GeomOut
#define GeomOutWithSmooth smooth GeomOut
#define GeomOutWithNoperspective noperspective GeomOut
#define FragInWithFlat flat FragIn
#define FragInWithSmooth smooth FragIn
#define FragInWithNoperspective noperspective FragIn
#else
// not supported under GLSL 1.20
#define VertOutWithFlat VertOut
#define VertOutWithSmooth VertOut
#define VertOutWithNoperspective VertOut
#define GeomInWithFlat GeomIn
#define GeomInWithSmooth GeomIn
#define GeomInWithNoperspective GeomIn
#define GeomOutWithFlat GeomOut
#define GeomOutWithSmooth GeomOut
#define GeomOutWithNoperspective GeomOut
#define FragInWithFlat FragIn
#define FragInWithSmooth FragIn
#define FragInWithNoperspective FragIn
#endif

#if __VERSION__ >= 130
#define LookupTexture1D( sampler, coord ) \
    texture( sampler, coord )
#else
#define LookupTexture1D( sampler, coord ) \
    texture1D( sampler, coord )
#endif

#if __VERSION__ >= 130
#define LookupTexture2D( sampler, coord ) \
    texture( sampler, coord )
#else
#define LookupTexture2D( sampler, coord ) \
    texture2D( sampler, coord )
#endif

#if __VERSION__ >= 130
#define LookupTexture3D( sampler, coord ) \
    texture( sampler, coord )
#else
#define LookupTexture3D( sampler, coord ) \
    texture3D( sampler, coord )
#endif

// Input parameters.
FragIn vec3 position_ndc;

// Uniform parameters.
uniform sampler2D entry_points; // entry points (front face)
uniform sampler2D exit_points; // exit points (back face)
uniform vec3 offset; // offset width for the gradient
uniform float dt; // sampling step
uniform float opaque; // opaque value
uniform vec3 light_position; // light position in the object coordinate
uniform vec3 camera_position; // camera position in the object coordinate
uniform VolumeParameter volume; // volume parameter
uniform sampler3D volume_data; // volume data
uniform sampler3D volume_data_2; // second volume
uniform ShadingParameter shading; // shading parameter
uniform TransferFunctionParameter transfer_function; // transfer function
uniform sampler2D transfer_function_data; // 2D transfer function data
uniform sampler2D jittering_texture; // texture for jittering
uniform float width; // screen width
uniform float height; // screen height
uniform sampler2D depth_texture; // depth texture for depth buffer
uniform sampler2D color_texture; // color texture for color buffer
uniform float to_zw1; // scaling parameter: (f*n)/(f-n)
uniform float to_zw2; // scaling parameter: 0.5*((f+n)/(f-n))+0.5
uniform float to_ze1; // scaling parameter: 0.5 + 0.5*((f+n)/(f-n))
uniform float to_ze2; // scaling parameter: (f-n)/(f*n)

// Uniform variables (OpenGL variables).
uniform mat4 ModelViewProjectionMatrixInverse; // inverse matrix of model-view projection matrix


/*===========================================================================*/
/**
 *  @brief  Return ray depth in window coordinate.
 *  @param  t [in] ratio parameter [0-1]
 *  @param  entry_depth [in] depth at entry point in window coodinate
 *  @param  exit_depth [in] depth at exit point in window coordinate
 *  @return depth in window coordinate
 */
/*===========================================================================*/
float RayDepth( in float t, in float entry_depth, in float exit_depth )
{
    // Calculate the depth value in window coordinate.
    // See: http://www.opengl.org/resources/faq/technical/depthbuffer.htm

    // zw_front: depth value at the entry point in window coordinate
    // ze_front: depth value at the entry point in camera (eye) coordinate
    float zw_front = entry_depth;
    float ze_front = 1.0 / ((zw_front - to_ze1)*to_ze2);

    // zw_front: depth value at the exit point in window coordinate
    // ze_front: depth value at the exit point in camera (eye) coordinate
    float zw_back = exit_depth;
    float ze_back = 1.0 / ((zw_back - to_ze1)*to_ze2);

    // First, the depth value at the dividing point (ze_current) in
    // camera coordinate is calculated with linear interpolation.
    // And then, the depth value in window coordinate (zw_current) is
    // converted from ze_current.
    float ze_current = ze_front + t * (ze_back - ze_front);
    float zw_current = (1.0/ze_current)*to_zw1 + to_zw2;

    return zw_current;
}

/*===========================================================================*/
/**
 *  @brief  Returns a transformed object coordinate from normalized device coordinate.
 *  @param  ndc [in] coordinate in normalized device coordinate
 *  @return coordinate in object coordinate
 */
/*===========================================================================*/
vec3 NDC2Obj( const in vec3 ndc )
{
    vec4 temp = ModelViewProjectionMatrixInverse * vec4( ndc, 1.0 );
    return temp.xyz / temp.w;
}

/*===========================================================================*/
/**
 *  @brief  Main function of fragment shader.
 */
/*===========================================================================*/
void main()
{
    vec2 index = vec2( gl_FragCoord.x / width, gl_FragCoord.y / height );
    vec4 entry = LookupTexture2D( entry_points, index );
    vec4 exit = LookupTexture2D( exit_points, index );

    // Entry and exit points and its depth values.
    vec3 entry_point = ( volume.resolution - vec3(1.0) ) * entry.xyz;
    vec3 exit_point = ( volume.resolution - vec3(1.0) ) * exit.xyz;
    if ( entry_point == exit_point ) { discard; return; } // out of volume

    float entry_depth = entry.w;
    float exit_depth = exit.w;

    // Depth and color values on the current frame buffers.
    float depth0 = LookupTexture2D( depth_texture, index ).x;
    vec3 color0 = LookupTexture2D( color_texture, index ).rgb;

    // Front face clipping.
    if ( entry_depth == 1.0 )
    {
        entry_point = NDC2Obj( vec3( position_ndc.xy, -1.0 ) );;
        entry_depth = 0.0;
    }

    // Number of steps (segments) along the viewing ray.
    float segment = distance( exit_point, entry_point );
#if defined( ENABLE_ALPHA_CORRECTION )
    int nsteps = 300;
    float dT = segment / float( nsteps );
    float dTdt = dT / dt;
#else
    int nsteps = int( floor( segment / dt ) );
    if ( nsteps == 0 ) nsteps++;
#endif

    // Ray direction.
#if defined( ENABLE_ALPHA_CORRECTION )
    vec3 direction = dT * normalize( exit_point - entry_point );
#else
    vec3 direction = dt * normalize( exit_point - entry_point );
#endif

    // Stochastic jittering.
#if defined( ENABLE_JITTERING )
    entry_point = entry_point + 0.1 * direction * LookupTexture2D( jittering_texture, gl_FragCoord.xy / 32.0 ).x;
#endif

    float tfunc_scale = 1.0 / ( transfer_function.max_value - transfer_function.min_value );

    // Ray traversal.
    vec3 position = entry_point;
    vec4 color = vec4( 0.0, 0.0, 0.0, 0.0 );
    float depth = entry_depth;
    for ( int i = 0; i < nsteps; i++ )
    {
        // Get the scalar value from the 3D texture.
        // NOTE: The volume index which is a index to access the volume data
        // represented as 3D texture can be calculate as follows:
        //
        //     vec3 A = ( R - vec3(1.0) ) / R; // ajusting parameter
        //     vec3 I = vec3( P + vec3(0.5) ) * A / ( R - vec3(1.0) );
        //            = vec3( P + vec3(0.5) ) / R;
        //
        // where, I: volume index, P: sampling point, R: volume resolution.
        vec3 volume_index = vec3( ( position + vec3(0.5) ) / volume.resolution );
        vec4 scalar = LookupTexture3D( volume_data, volume_index );
        vec4 scalar2 = LookupTexture3D( volume_data_2, volume_index );

        // Get the source color from the transfer function.
        // The min max range is limited as 0.0 to 1.0, so the following process is not needed.
        // float tfunc_index = ( scalar - transfer_function.min_value ) * tfunc_scale;
        vec4 c = LookupTexture2D( transfer_function_data, vec2( scalar.w, scalar2.w ) );

#if defined( ENABLE_ALPHA_CORRECTION )
        c.a = 1.0 - pow( 1.0 - c.a, dTdt );
#endif

        if ( c.a != 0.0 )
        {
            // Get the normal vector in object coordinate.
            vec3 offset_index = vec3( volume.resolution_reciprocal );
            vec3 normal = VolumeGradient( volume_data, volume_index, offset_index );

            // Light vector (L) and normal vector (N) in camera coordinate.
            vec3 L = normalize( light_position - position );
            vec3 N = normalize( gl_NormalMatrix * normal );

#if   defined( ENABLE_LAMBERT_SHADING )
            c.rgb = ShadingLambert( shading, c.rgb, L, N );

#elif defined( ENABLE_PHONG_SHADING )
            vec3 V = normalize( camera_position - position );
            c.rgb = ShadingPhong( shading, c.rgb, L, N, V );

#elif defined( ENABLE_BLINN_PHONG_SHADING )
            vec3 V = normalize( camera_position - position );
            c.rgb = ShadingBlinnPhong( shading, c.rgb, L, N, V );

#else // DISABLE SHADING
            c.rgb = ShadingNone( shading, c.rgb );
#endif

            // Front-to-back composition.
            color.rgb += ( 1.0 - color.a ) * c.a * c.rgb;
            color.a += ( 1.0 - color.a ) * c.a;

            // Early ray termination.
            if ( color.a > opaque )
            {
                color.a = 1.0;
                break; // break
            }
        }

        // Depth comparison between the depth at the sampling point
        // and depth stored in the depth buffer.
        float w = float(i) / float( nsteps - 1 );
        depth = RayDepth( w, entry_depth, exit_depth );
        if ( depth > depth0 )
        {
            color.rgb += ( 1.0 - color.a ) * color0.rgb;
            color.a = 1.0;
            break;
        }

        position += direction;
    }

    gl_FragColor = color;
    gl_FragDepth = depth;
}
